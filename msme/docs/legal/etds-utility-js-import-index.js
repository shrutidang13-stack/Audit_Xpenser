var dm = Object.defineProperty;
var fm = (e, t, n) => t in e ? dm(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var ke = (e, t, n) => fm(e, typeof t != "symbol" ? t + "" : t, n);
import * as le from "react";
import l, { useMemo as rn, useRef as _e, useReducer as cd, useEffect as ye, useCallback as vt, forwardRef as Xi, useImperativeHandle as ud, Fragment as Ni, useState as V, useContext as Un, useLayoutEffect as pm, createContext as dd, Component as mm } from "react";
import re, { ClayIconSpriteContext as hl } from "@clayui/icon";
import { Provider as jr } from "@clayui/core";
import fd from "@clayui/loading-indicator";
import * as Zi from "react-dom";
import di, { createPortal as gm } from "react-dom";
import hm from "@clayui/date-picker";
import vm from "@clayui/alert";
import { ClayTooltipProvider as vl } from "@clayui/tooltip";
import hn, { useModal as Br } from "@clayui/modal";
import ym from "@clayui/button";
const pd = 6048e5, bm = 864e5, wm = 6e4, xm = 36e5, Em = 1e3, wc = Symbol.for("constructDateFrom");
function on(e, t) {
  return typeof e == "function" ? e(t) : e && typeof e == "object" && wc in e ? e[wc](t) : e instanceof Date ? new e.constructor(t) : new Date(t);
}
function Kt(e, t) {
  return on(t || e, e);
}
function md(e, t, n) {
  const r = Kt(e, n == null ? void 0 : n.in);
  return isNaN(t) ? on((n == null ? void 0 : n.in) || e, NaN) : (t && r.setDate(r.getDate() + t), r);
}
let Lm = {};
function pa() {
  return Lm;
}
function Cr(e, t) {
  var c, u, p, g;
  const n = pa(), r = (t == null ? void 0 : t.weekStartsOn) ?? ((u = (c = t == null ? void 0 : t.locale) == null ? void 0 : c.options) == null ? void 0 : u.weekStartsOn) ?? n.weekStartsOn ?? ((g = (p = n.locale) == null ? void 0 : p.options) == null ? void 0 : g.weekStartsOn) ?? 0, a = Kt(e, t == null ? void 0 : t.in), i = a.getDay(), s = (i < r ? 7 : 0) + i - r;
  return a.setDate(a.getDate() - s), a.setHours(0, 0, 0, 0), a;
}
function oa(e, t) {
  return Cr(e, { ...t, weekStartsOn: 1 });
}
function gd(e, t) {
  const n = Kt(e, t == null ? void 0 : t.in), r = n.getFullYear(), a = on(n, 0);
  a.setFullYear(r + 1, 0, 4), a.setHours(0, 0, 0, 0);
  const i = oa(a), s = on(n, 0);
  s.setFullYear(r, 0, 4), s.setHours(0, 0, 0, 0);
  const c = oa(s);
  return n.getTime() >= i.getTime() ? r + 1 : n.getTime() >= c.getTime() ? r : r - 1;
}
function Ri(e) {
  const t = Kt(e), n = new Date(
    Date.UTC(
      t.getFullYear(),
      t.getMonth(),
      t.getDate(),
      t.getHours(),
      t.getMinutes(),
      t.getSeconds(),
      t.getMilliseconds()
    )
  );
  return n.setUTCFullYear(t.getFullYear()), +e - +n;
}
function Cm(e, ...t) {
  const n = on.bind(
    null,
    t.find((r) => typeof r == "object")
  );
  return t.map(n);
}
function xc(e, t) {
  const n = Kt(e, t == null ? void 0 : t.in);
  return n.setHours(0, 0, 0, 0), n;
}
function Sm(e, t, n) {
  const [r, a] = Cm(
    n == null ? void 0 : n.in,
    e,
    t
  ), i = xc(r), s = xc(a), c = +i - Ri(i), u = +s - Ri(s);
  return Math.round((c - u) / bm);
}
function Tm(e, t) {
  const n = gd(e, t), r = on(e, 0);
  return r.setFullYear(n, 0, 4), r.setHours(0, 0, 0, 0), oa(r);
}
function Dm(e) {
  return e instanceof Date || typeof e == "object" && Object.prototype.toString.call(e) === "[object Date]";
}
function yl(e) {
  return !(!Dm(e) && typeof e != "number" || isNaN(+Kt(e)));
}
function km(e, t) {
  const n = Kt(e, t == null ? void 0 : t.in);
  return n.setFullYear(n.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n;
}
const Pm = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
}, Nm = (e, t, n) => {
  let r;
  const a = Pm[e];
  return typeof a == "string" ? r = a : t === 1 ? r = a.one : r = a.other.replace("{{count}}", t.toString()), n != null && n.addSuffix ? n.comparison && n.comparison > 0 ? "in " + r : r + " ago" : r;
};
function aa(e) {
  return (t = {}) => {
    const n = t.width ? String(t.width) : e.defaultWidth;
    return e.formats[n] || e.formats[e.defaultWidth];
  };
}
const Rm = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
}, Im = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
}, Am = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, Om = {
  date: aa({
    formats: Rm,
    defaultWidth: "full"
  }),
  time: aa({
    formats: Im,
    defaultWidth: "full"
  }),
  dateTime: aa({
    formats: Am,
    defaultWidth: "full"
  })
}, Mm = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
}, $m = (e, t, n, r) => Mm[e];
function Qn(e) {
  return (t, n) => {
    const r = n != null && n.context ? String(n.context) : "standalone";
    let a;
    if (r === "formatting" && e.formattingValues) {
      const s = e.defaultFormattingWidth || e.defaultWidth, c = n != null && n.width ? String(n.width) : s;
      a = e.formattingValues[c] || e.formattingValues[s];
    } else {
      const s = e.defaultWidth, c = n != null && n.width ? String(n.width) : e.defaultWidth;
      a = e.values[c] || e.values[s];
    }
    const i = e.argumentCallback ? e.argumentCallback(t) : t;
    return a[i];
  };
}
const Fm = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
}, _m = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
}, jm = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
}, Vm = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
}, Um = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
}, Bm = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
}, Hm = (e, t) => {
  const n = Number(e), r = n % 100;
  if (r > 20 || r < 10)
    switch (r % 10) {
      case 1:
        return n + "st";
      case 2:
        return n + "nd";
      case 3:
        return n + "rd";
    }
  return n + "th";
}, zm = {
  ordinalNumber: Hm,
  era: Qn({
    values: Fm,
    defaultWidth: "wide"
  }),
  quarter: Qn({
    values: _m,
    defaultWidth: "wide",
    argumentCallback: (e) => e - 1
  }),
  month: Qn({
    values: jm,
    defaultWidth: "wide"
  }),
  day: Qn({
    values: Vm,
    defaultWidth: "wide"
  }),
  dayPeriod: Qn({
    values: Um,
    defaultWidth: "wide",
    formattingValues: Bm,
    defaultFormattingWidth: "wide"
  })
};
function Xn(e) {
  return (t, n = {}) => {
    const r = n.width, a = r && e.matchPatterns[r] || e.matchPatterns[e.defaultMatchWidth], i = t.match(a);
    if (!i)
      return null;
    const s = i[0], c = r && e.parsePatterns[r] || e.parsePatterns[e.defaultParseWidth], u = Array.isArray(c) ? Wm(c, (v) => v.test(s)) : (
      // [TODO] -- I challenge you to fix the type
      qm(c, (v) => v.test(s))
    );
    let p;
    p = e.valueCallback ? e.valueCallback(u) : u, p = n.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      n.valueCallback(p)
    ) : p;
    const g = t.slice(s.length);
    return { value: p, rest: g };
  };
}
function qm(e, t) {
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && t(e[n]))
      return n;
}
function Wm(e, t) {
  for (let n = 0; n < e.length; n++)
    if (t(e[n]))
      return n;
}
function hd(e) {
  return (t, n = {}) => {
    const r = t.match(e.matchPattern);
    if (!r) return null;
    const a = r[0], i = t.match(e.parsePattern);
    if (!i) return null;
    let s = e.valueCallback ? e.valueCallback(i[0]) : i[0];
    s = n.valueCallback ? n.valueCallback(s) : s;
    const c = t.slice(a.length);
    return { value: s, rest: c };
  };
}
const Ym = /^(\d+)(th|st|nd|rd)?/i, Gm = /\d+/i, Km = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
}, Jm = {
  any: [/^b/i, /^(a|c)/i]
}, Qm = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
}, Xm = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, Zm = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
}, eg = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
}, tg = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
}, ng = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
}, rg = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
}, ag = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
}, ig = {
  ordinalNumber: hd({
    matchPattern: Ym,
    parsePattern: Gm,
    valueCallback: (e) => parseInt(e, 10)
  }),
  era: Xn({
    matchPatterns: Km,
    defaultMatchWidth: "wide",
    parsePatterns: Jm,
    defaultParseWidth: "any"
  }),
  quarter: Xn({
    matchPatterns: Qm,
    defaultMatchWidth: "wide",
    parsePatterns: Xm,
    defaultParseWidth: "any",
    valueCallback: (e) => e + 1
  }),
  month: Xn({
    matchPatterns: Zm,
    defaultMatchWidth: "wide",
    parsePatterns: eg,
    defaultParseWidth: "any"
  }),
  day: Xn({
    matchPatterns: tg,
    defaultMatchWidth: "wide",
    parsePatterns: ng,
    defaultParseWidth: "any"
  }),
  dayPeriod: Xn({
    matchPatterns: rg,
    defaultMatchWidth: "any",
    parsePatterns: ag,
    defaultParseWidth: "any"
  })
}, qa = {
  code: "en-US",
  formatDistance: Nm,
  formatLong: Om,
  formatRelative: $m,
  localize: zm,
  match: ig,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function og(e, t) {
  const n = Kt(e, t == null ? void 0 : t.in);
  return Sm(n, km(n)) + 1;
}
function vd(e, t) {
  const n = Kt(e, t == null ? void 0 : t.in), r = +oa(n) - +Tm(n);
  return Math.round(r / pd) + 1;
}
function bl(e, t) {
  var g, v, y, E;
  const n = Kt(e, t == null ? void 0 : t.in), r = n.getFullYear(), a = pa(), i = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((v = (g = t == null ? void 0 : t.locale) == null ? void 0 : g.options) == null ? void 0 : v.firstWeekContainsDate) ?? a.firstWeekContainsDate ?? ((E = (y = a.locale) == null ? void 0 : y.options) == null ? void 0 : E.firstWeekContainsDate) ?? 1, s = on((t == null ? void 0 : t.in) || e, 0);
  s.setFullYear(r + 1, 0, i), s.setHours(0, 0, 0, 0);
  const c = Cr(s, t), u = on((t == null ? void 0 : t.in) || e, 0);
  u.setFullYear(r, 0, i), u.setHours(0, 0, 0, 0);
  const p = Cr(u, t);
  return +n >= +c ? r + 1 : +n >= +p ? r : r - 1;
}
function sg(e, t) {
  var c, u, p, g;
  const n = pa(), r = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((u = (c = t == null ? void 0 : t.locale) == null ? void 0 : c.options) == null ? void 0 : u.firstWeekContainsDate) ?? n.firstWeekContainsDate ?? ((g = (p = n.locale) == null ? void 0 : p.options) == null ? void 0 : g.firstWeekContainsDate) ?? 1, a = bl(e, t), i = on((t == null ? void 0 : t.in) || e, 0);
  return i.setFullYear(a, 0, r), i.setHours(0, 0, 0, 0), Cr(i, t);
}
function yd(e, t) {
  const n = Kt(e, t == null ? void 0 : t.in), r = +Cr(n, t) - +sg(n, t);
  return Math.round(r / pd) + 1;
}
function kt(e, t) {
  const n = e < 0 ? "-" : "", r = Math.abs(e).toString().padStart(t, "0");
  return n + r;
}
const yr = {
  // Year
  y(e, t) {
    const n = e.getFullYear(), r = n > 0 ? n : 1 - n;
    return kt(t === "yy" ? r % 100 : r, t.length);
  },
  // Month
  M(e, t) {
    const n = e.getMonth();
    return t === "M" ? String(n + 1) : kt(n + 1, 2);
  },
  // Day of the month
  d(e, t) {
    return kt(e.getDate(), t.length);
  },
  // AM or PM
  a(e, t) {
    const n = e.getHours() / 12 >= 1 ? "pm" : "am";
    switch (t) {
      case "a":
      case "aa":
        return n.toUpperCase();
      case "aaa":
        return n;
      case "aaaaa":
        return n[0];
      case "aaaa":
      default:
        return n === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(e, t) {
    return kt(e.getHours() % 12 || 12, t.length);
  },
  // Hour [0-23]
  H(e, t) {
    return kt(e.getHours(), t.length);
  },
  // Minute
  m(e, t) {
    return kt(e.getMinutes(), t.length);
  },
  // Second
  s(e, t) {
    return kt(e.getSeconds(), t.length);
  },
  // Fraction of second
  S(e, t) {
    const n = t.length, r = e.getMilliseconds(), a = Math.trunc(
      r * Math.pow(10, n - 3)
    );
    return kt(a, t.length);
  }
}, Xr = {
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
}, Ec = {
  // Era
  G: function(e, t, n) {
    const r = e.getFullYear() > 0 ? 1 : 0;
    switch (t) {
      case "G":
      case "GG":
      case "GGG":
        return n.era(r, { width: "abbreviated" });
      case "GGGGG":
        return n.era(r, { width: "narrow" });
      case "GGGG":
      default:
        return n.era(r, { width: "wide" });
    }
  },
  // Year
  y: function(e, t, n) {
    if (t === "yo") {
      const r = e.getFullYear(), a = r > 0 ? r : 1 - r;
      return n.ordinalNumber(a, { unit: "year" });
    }
    return yr.y(e, t);
  },
  // Local week-numbering year
  Y: function(e, t, n, r) {
    const a = bl(e, r), i = a > 0 ? a : 1 - a;
    if (t === "YY") {
      const s = i % 100;
      return kt(s, 2);
    }
    return t === "Yo" ? n.ordinalNumber(i, { unit: "year" }) : kt(i, t.length);
  },
  // ISO week-numbering year
  R: function(e, t) {
    const n = gd(e);
    return kt(n, t.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(e, t) {
    const n = e.getFullYear();
    return kt(n, t.length);
  },
  // Quarter
  Q: function(e, t, n) {
    const r = Math.ceil((e.getMonth() + 1) / 3);
    switch (t) {
      case "Q":
        return String(r);
      case "QQ":
        return kt(r, 2);
      case "Qo":
        return n.ordinalNumber(r, { unit: "quarter" });
      case "QQQ":
        return n.quarter(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "QQQQQ":
        return n.quarter(r, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQ":
      default:
        return n.quarter(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(e, t, n) {
    const r = Math.ceil((e.getMonth() + 1) / 3);
    switch (t) {
      case "q":
        return String(r);
      case "qq":
        return kt(r, 2);
      case "qo":
        return n.ordinalNumber(r, { unit: "quarter" });
      case "qqq":
        return n.quarter(r, {
          width: "abbreviated",
          context: "standalone"
        });
      case "qqqqq":
        return n.quarter(r, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqq":
      default:
        return n.quarter(r, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(e, t, n) {
    const r = e.getMonth();
    switch (t) {
      case "M":
      case "MM":
        return yr.M(e, t);
      case "Mo":
        return n.ordinalNumber(r + 1, { unit: "month" });
      case "MMM":
        return n.month(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "MMMMM":
        return n.month(r, {
          width: "narrow",
          context: "formatting"
        });
      case "MMMM":
      default:
        return n.month(r, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(e, t, n) {
    const r = e.getMonth();
    switch (t) {
      case "L":
        return String(r + 1);
      case "LL":
        return kt(r + 1, 2);
      case "Lo":
        return n.ordinalNumber(r + 1, { unit: "month" });
      case "LLL":
        return n.month(r, {
          width: "abbreviated",
          context: "standalone"
        });
      case "LLLLL":
        return n.month(r, {
          width: "narrow",
          context: "standalone"
        });
      case "LLLL":
      default:
        return n.month(r, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(e, t, n, r) {
    const a = yd(e, r);
    return t === "wo" ? n.ordinalNumber(a, { unit: "week" }) : kt(a, t.length);
  },
  // ISO week of year
  I: function(e, t, n) {
    const r = vd(e);
    return t === "Io" ? n.ordinalNumber(r, { unit: "week" }) : kt(r, t.length);
  },
  // Day of the month
  d: function(e, t, n) {
    return t === "do" ? n.ordinalNumber(e.getDate(), { unit: "date" }) : yr.d(e, t);
  },
  // Day of year
  D: function(e, t, n) {
    const r = og(e);
    return t === "Do" ? n.ordinalNumber(r, { unit: "dayOfYear" }) : kt(r, t.length);
  },
  // Day of week
  E: function(e, t, n) {
    const r = e.getDay();
    switch (t) {
      case "E":
      case "EE":
      case "EEE":
        return n.day(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "EEEEE":
        return n.day(r, {
          width: "narrow",
          context: "formatting"
        });
      case "EEEEEE":
        return n.day(r, {
          width: "short",
          context: "formatting"
        });
      case "EEEE":
      default:
        return n.day(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(e, t, n, r) {
    const a = e.getDay(), i = (a - r.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "e":
        return String(i);
      case "ee":
        return kt(i, 2);
      case "eo":
        return n.ordinalNumber(i, { unit: "day" });
      case "eee":
        return n.day(a, {
          width: "abbreviated",
          context: "formatting"
        });
      case "eeeee":
        return n.day(a, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":
        return n.day(a, {
          width: "short",
          context: "formatting"
        });
      case "eeee":
      default:
        return n.day(a, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(e, t, n, r) {
    const a = e.getDay(), i = (a - r.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "c":
        return String(i);
      case "cc":
        return kt(i, t.length);
      case "co":
        return n.ordinalNumber(i, { unit: "day" });
      case "ccc":
        return n.day(a, {
          width: "abbreviated",
          context: "standalone"
        });
      case "ccccc":
        return n.day(a, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":
        return n.day(a, {
          width: "short",
          context: "standalone"
        });
      case "cccc":
      default:
        return n.day(a, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(e, t, n) {
    const r = e.getDay(), a = r === 0 ? 7 : r;
    switch (t) {
      case "i":
        return String(a);
      case "ii":
        return kt(a, t.length);
      case "io":
        return n.ordinalNumber(a, { unit: "day" });
      case "iii":
        return n.day(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "iiiii":
        return n.day(r, {
          width: "narrow",
          context: "formatting"
        });
      case "iiiiii":
        return n.day(r, {
          width: "short",
          context: "formatting"
        });
      case "iiii":
      default:
        return n.day(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(e, t, n) {
    const a = e.getHours() / 12 >= 1 ? "pm" : "am";
    switch (t) {
      case "a":
      case "aa":
        return n.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return n.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return n.dayPeriod(a, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return n.dayPeriod(a, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(e, t, n) {
    const r = e.getHours();
    let a;
    switch (r === 12 ? a = Xr.noon : r === 0 ? a = Xr.midnight : a = r / 12 >= 1 ? "pm" : "am", t) {
      case "b":
      case "bb":
        return n.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return n.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return n.dayPeriod(a, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return n.dayPeriod(a, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(e, t, n) {
    const r = e.getHours();
    let a;
    switch (r >= 17 ? a = Xr.evening : r >= 12 ? a = Xr.afternoon : r >= 4 ? a = Xr.morning : a = Xr.night, t) {
      case "B":
      case "BB":
      case "BBB":
        return n.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return n.dayPeriod(a, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return n.dayPeriod(a, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(e, t, n) {
    if (t === "ho") {
      let r = e.getHours() % 12;
      return r === 0 && (r = 12), n.ordinalNumber(r, { unit: "hour" });
    }
    return yr.h(e, t);
  },
  // Hour [0-23]
  H: function(e, t, n) {
    return t === "Ho" ? n.ordinalNumber(e.getHours(), { unit: "hour" }) : yr.H(e, t);
  },
  // Hour [0-11]
  K: function(e, t, n) {
    const r = e.getHours() % 12;
    return t === "Ko" ? n.ordinalNumber(r, { unit: "hour" }) : kt(r, t.length);
  },
  // Hour [1-24]
  k: function(e, t, n) {
    let r = e.getHours();
    return r === 0 && (r = 24), t === "ko" ? n.ordinalNumber(r, { unit: "hour" }) : kt(r, t.length);
  },
  // Minute
  m: function(e, t, n) {
    return t === "mo" ? n.ordinalNumber(e.getMinutes(), { unit: "minute" }) : yr.m(e, t);
  },
  // Second
  s: function(e, t, n) {
    return t === "so" ? n.ordinalNumber(e.getSeconds(), { unit: "second" }) : yr.s(e, t);
  },
  // Fraction of second
  S: function(e, t) {
    return yr.S(e, t);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(e, t, n) {
    const r = e.getTimezoneOffset();
    if (r === 0)
      return "Z";
    switch (t) {
      case "X":
        return Cc(r);
      case "XXXX":
      case "XX":
        return Ar(r);
      case "XXXXX":
      case "XXX":
      default:
        return Ar(r, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(e, t, n) {
    const r = e.getTimezoneOffset();
    switch (t) {
      case "x":
        return Cc(r);
      case "xxxx":
      case "xx":
        return Ar(r);
      case "xxxxx":
      case "xxx":
      default:
        return Ar(r, ":");
    }
  },
  // Timezone (GMT)
  O: function(e, t, n) {
    const r = e.getTimezoneOffset();
    switch (t) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + Lc(r, ":");
      case "OOOO":
      default:
        return "GMT" + Ar(r, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(e, t, n) {
    const r = e.getTimezoneOffset();
    switch (t) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + Lc(r, ":");
      case "zzzz":
      default:
        return "GMT" + Ar(r, ":");
    }
  },
  // Seconds timestamp
  t: function(e, t, n) {
    const r = Math.trunc(+e / 1e3);
    return kt(r, t.length);
  },
  // Milliseconds timestamp
  T: function(e, t, n) {
    return kt(+e, t.length);
  }
};
function Lc(e, t = "") {
  const n = e > 0 ? "-" : "+", r = Math.abs(e), a = Math.trunc(r / 60), i = r % 60;
  return i === 0 ? n + String(a) : n + String(a) + t + kt(i, 2);
}
function Cc(e, t) {
  return e % 60 === 0 ? (e > 0 ? "-" : "+") + kt(Math.abs(e) / 60, 2) : Ar(e, t);
}
function Ar(e, t = "") {
  const n = e > 0 ? "-" : "+", r = Math.abs(e), a = kt(Math.trunc(r / 60), 2), i = kt(r % 60, 2);
  return n + a + t + i;
}
const Sc = (e, t) => {
  switch (e) {
    case "P":
      return t.date({ width: "short" });
    case "PP":
      return t.date({ width: "medium" });
    case "PPP":
      return t.date({ width: "long" });
    case "PPPP":
    default:
      return t.date({ width: "full" });
  }
}, bd = (e, t) => {
  switch (e) {
    case "p":
      return t.time({ width: "short" });
    case "pp":
      return t.time({ width: "medium" });
    case "ppp":
      return t.time({ width: "long" });
    case "pppp":
    default:
      return t.time({ width: "full" });
  }
}, lg = (e, t) => {
  const n = e.match(/(P+)(p+)?/) || [], r = n[1], a = n[2];
  if (!a)
    return Sc(e, t);
  let i;
  switch (r) {
    case "P":
      i = t.dateTime({ width: "short" });
      break;
    case "PP":
      i = t.dateTime({ width: "medium" });
      break;
    case "PPP":
      i = t.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      i = t.dateTime({ width: "full" });
      break;
  }
  return i.replace("{{date}}", Sc(r, t)).replace("{{time}}", bd(a, t));
}, Os = {
  p: bd,
  P: lg
}, cg = /^D+$/, ug = /^Y+$/, dg = ["D", "DD", "YY", "YYYY"];
function wd(e) {
  return cg.test(e);
}
function xd(e) {
  return ug.test(e);
}
function Ms(e, t, n) {
  const r = fg(e, t, n);
  if (console.warn(r), dg.includes(e)) throw new RangeError(r);
}
function fg(e, t, n) {
  const r = e[0] === "Y" ? "years" : "days of the month";
  return `Use \`${e.toLowerCase()}\` instead of \`${e}\` (in \`${t}\`) for formatting ${r} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const pg = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, mg = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, gg = /^'([^]*?)'?$/, hg = /''/g, vg = /[a-zA-Z]/;
function eo(e, t, n) {
  var g, v, y, E, L, x, C, T;
  const r = pa(), a = (n == null ? void 0 : n.locale) ?? r.locale ?? qa, i = (n == null ? void 0 : n.firstWeekContainsDate) ?? ((v = (g = n == null ? void 0 : n.locale) == null ? void 0 : g.options) == null ? void 0 : v.firstWeekContainsDate) ?? r.firstWeekContainsDate ?? ((E = (y = r.locale) == null ? void 0 : y.options) == null ? void 0 : E.firstWeekContainsDate) ?? 1, s = (n == null ? void 0 : n.weekStartsOn) ?? ((x = (L = n == null ? void 0 : n.locale) == null ? void 0 : L.options) == null ? void 0 : x.weekStartsOn) ?? r.weekStartsOn ?? ((T = (C = r.locale) == null ? void 0 : C.options) == null ? void 0 : T.weekStartsOn) ?? 0, c = Kt(e, n == null ? void 0 : n.in);
  if (!yl(c))
    throw new RangeError("Invalid time value");
  let u = t.match(mg).map((D) => {
    const k = D[0];
    if (k === "p" || k === "P") {
      const N = Os[k];
      return N(D, a.formatLong);
    }
    return D;
  }).join("").match(pg).map((D) => {
    if (D === "''")
      return { isToken: !1, value: "'" };
    const k = D[0];
    if (k === "'")
      return { isToken: !1, value: yg(D) };
    if (Ec[k])
      return { isToken: !0, value: D };
    if (k.match(vg))
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + k + "`"
      );
    return { isToken: !1, value: D };
  });
  a.localize.preprocessor && (u = a.localize.preprocessor(c, u));
  const p = {
    firstWeekContainsDate: i,
    weekStartsOn: s,
    locale: a
  };
  return u.map((D) => {
    if (!D.isToken) return D.value;
    const k = D.value;
    (!(n != null && n.useAdditionalWeekYearTokens) && xd(k) || !(n != null && n.useAdditionalDayOfYearTokens) && wd(k)) && Ms(k, t, String(e));
    const N = Ec[k[0]];
    return N(c, k, a.localize, p);
  }).join("");
}
function yg(e) {
  const t = e.match(gg);
  return t ? t[1].replace(hg, "'") : e;
}
function bg() {
  return Object.assign({}, pa());
}
function wg(e, t) {
  const n = Kt(e, t == null ? void 0 : t.in).getDay();
  return n === 0 ? 7 : n;
}
function xg(e, t) {
  const n = Eg(t) ? new t(0) : on(t, 0);
  return n.setFullYear(e.getFullYear(), e.getMonth(), e.getDate()), n.setHours(
    e.getHours(),
    e.getMinutes(),
    e.getSeconds(),
    e.getMilliseconds()
  ), n;
}
function Eg(e) {
  var t;
  return typeof e == "function" && ((t = e.prototype) == null ? void 0 : t.constructor) === e;
}
const Lg = 10;
class Ed {
  constructor() {
    ke(this, "subPriority", 0);
  }
  validate(t, n) {
    return !0;
  }
}
class Cg extends Ed {
  constructor(t, n, r, a, i) {
    super(), this.value = t, this.validateValue = n, this.setValue = r, this.priority = a, i && (this.subPriority = i);
  }
  validate(t, n) {
    return this.validateValue(t, this.value, n);
  }
  set(t, n, r) {
    return this.setValue(t, n, this.value, r);
  }
}
class Sg extends Ed {
  constructor(n, r) {
    super();
    ke(this, "priority", Lg);
    ke(this, "subPriority", -1);
    this.context = n || ((a) => on(r, a));
  }
  set(n, r) {
    return r.timestampIsSet ? n : on(n, xg(n, this.context));
  }
}
class Lt {
  run(t, n, r, a) {
    const i = this.parse(t, n, r, a);
    return i ? {
      setter: new Cg(
        i.value,
        this.validate,
        this.set,
        this.priority,
        this.subPriority
      ),
      rest: i.rest
    } : null;
  }
  validate(t, n, r) {
    return !0;
  }
}
class Tg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 140);
    ke(this, "incompatibleTokens", ["R", "u", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "G":
      case "GG":
      case "GGG":
        return a.era(n, { width: "abbreviated" }) || a.era(n, { width: "narrow" });
      case "GGGGG":
        return a.era(n, { width: "narrow" });
      case "GGGG":
      default:
        return a.era(n, { width: "wide" }) || a.era(n, { width: "abbreviated" }) || a.era(n, { width: "narrow" });
    }
  }
  set(n, r, a) {
    return r.era = a, n.setFullYear(a, 0, 1), n.setHours(0, 0, 0, 0), n;
  }
}
const Wt = {
  month: /^(1[0-2]|0?\d)/,
  // 0 to 12
  date: /^(3[0-1]|[0-2]?\d)/,
  // 0 to 31
  dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
  // 0 to 366
  week: /^(5[0-3]|[0-4]?\d)/,
  // 0 to 53
  hour23h: /^(2[0-3]|[0-1]?\d)/,
  // 0 to 23
  hour24h: /^(2[0-4]|[0-1]?\d)/,
  // 0 to 24
  hour11h: /^(1[0-1]|0?\d)/,
  // 0 to 11
  hour12h: /^(1[0-2]|0?\d)/,
  // 0 to 12
  minute: /^[0-5]?\d/,
  // 0 to 59
  second: /^[0-5]?\d/,
  // 0 to 59
  singleDigit: /^\d/,
  // 0 to 9
  twoDigits: /^\d{1,2}/,
  // 0 to 99
  threeDigits: /^\d{1,3}/,
  // 0 to 999
  fourDigits: /^\d{1,4}/,
  // 0 to 9999
  anyDigitsSigned: /^-?\d+/,
  singleDigitSigned: /^-?\d/,
  // 0 to 9, -0 to -9
  twoDigitsSigned: /^-?\d{1,2}/,
  // 0 to 99, -0 to -99
  threeDigitsSigned: /^-?\d{1,3}/,
  // 0 to 999, -0 to -999
  fourDigitsSigned: /^-?\d{1,4}/
  // 0 to 9999, -0 to -9999
}, Zn = {
  basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
  basic: /^([+-])(\d{2})(\d{2})|Z/,
  basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
  extended: /^([+-])(\d{2}):(\d{2})|Z/,
  extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/
};
function Yt(e, t) {
  return e && {
    value: t(e.value),
    rest: e.rest
  };
}
function Ft(e, t) {
  const n = t.match(e);
  return n ? {
    value: parseInt(n[0], 10),
    rest: t.slice(n[0].length)
  } : null;
}
function er(e, t) {
  const n = t.match(e);
  if (!n)
    return null;
  if (n[0] === "Z")
    return {
      value: 0,
      rest: t.slice(1)
    };
  const r = n[1] === "+" ? 1 : -1, a = n[2] ? parseInt(n[2], 10) : 0, i = n[3] ? parseInt(n[3], 10) : 0, s = n[5] ? parseInt(n[5], 10) : 0;
  return {
    value: r * (a * xm + i * wm + s * Em),
    rest: t.slice(n[0].length)
  };
}
function Ld(e) {
  return Ft(Wt.anyDigitsSigned, e);
}
function Bt(e, t) {
  switch (e) {
    case 1:
      return Ft(Wt.singleDigit, t);
    case 2:
      return Ft(Wt.twoDigits, t);
    case 3:
      return Ft(Wt.threeDigits, t);
    case 4:
      return Ft(Wt.fourDigits, t);
    default:
      return Ft(new RegExp("^\\d{1," + e + "}"), t);
  }
}
function Ii(e, t) {
  switch (e) {
    case 1:
      return Ft(Wt.singleDigitSigned, t);
    case 2:
      return Ft(Wt.twoDigitsSigned, t);
    case 3:
      return Ft(Wt.threeDigitsSigned, t);
    case 4:
      return Ft(Wt.fourDigitsSigned, t);
    default:
      return Ft(new RegExp("^-?\\d{1," + e + "}"), t);
  }
}
function wl(e) {
  switch (e) {
    case "morning":
      return 4;
    case "evening":
      return 17;
    case "pm":
    case "noon":
    case "afternoon":
      return 12;
    case "am":
    case "midnight":
    case "night":
    default:
      return 0;
  }
}
function Cd(e, t) {
  const n = t > 0, r = n ? t : 1 - t;
  let a;
  if (r <= 50)
    a = e || 100;
  else {
    const i = r + 50, s = Math.trunc(i / 100) * 100, c = e >= i % 100;
    a = e + s - (c ? 100 : 0);
  }
  return n ? a : 1 - a;
}
function Sd(e) {
  return e % 400 === 0 || e % 4 === 0 && e % 100 !== 0;
}
class Dg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 130);
    ke(this, "incompatibleTokens", ["Y", "R", "u", "w", "I", "i", "e", "c", "t", "T"]);
  }
  parse(n, r, a) {
    const i = (s) => ({
      year: s,
      isTwoDigitYear: r === "yy"
    });
    switch (r) {
      case "y":
        return Yt(Bt(4, n), i);
      case "yo":
        return Yt(
          a.ordinalNumber(n, {
            unit: "year"
          }),
          i
        );
      default:
        return Yt(Bt(r.length, n), i);
    }
  }
  validate(n, r) {
    return r.isTwoDigitYear || r.year > 0;
  }
  set(n, r, a) {
    const i = n.getFullYear();
    if (a.isTwoDigitYear) {
      const c = Cd(
        a.year,
        i
      );
      return n.setFullYear(c, 0, 1), n.setHours(0, 0, 0, 0), n;
    }
    const s = !("era" in r) || r.era === 1 ? a.year : 1 - a.year;
    return n.setFullYear(s, 0, 1), n.setHours(0, 0, 0, 0), n;
  }
}
class kg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 130);
    ke(this, "incompatibleTokens", [
      "y",
      "R",
      "u",
      "Q",
      "q",
      "M",
      "L",
      "I",
      "d",
      "D",
      "i",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    const i = (s) => ({
      year: s,
      isTwoDigitYear: r === "YY"
    });
    switch (r) {
      case "Y":
        return Yt(Bt(4, n), i);
      case "Yo":
        return Yt(
          a.ordinalNumber(n, {
            unit: "year"
          }),
          i
        );
      default:
        return Yt(Bt(r.length, n), i);
    }
  }
  validate(n, r) {
    return r.isTwoDigitYear || r.year > 0;
  }
  set(n, r, a, i) {
    const s = bl(n, i);
    if (a.isTwoDigitYear) {
      const u = Cd(
        a.year,
        s
      );
      return n.setFullYear(
        u,
        0,
        i.firstWeekContainsDate
      ), n.setHours(0, 0, 0, 0), Cr(n, i);
    }
    const c = !("era" in r) || r.era === 1 ? a.year : 1 - a.year;
    return n.setFullYear(c, 0, i.firstWeekContainsDate), n.setHours(0, 0, 0, 0), Cr(n, i);
  }
}
class Pg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 130);
    ke(this, "incompatibleTokens", [
      "G",
      "y",
      "Y",
      "u",
      "Q",
      "q",
      "M",
      "L",
      "w",
      "d",
      "D",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r) {
    return Ii(r === "R" ? 4 : r.length, n);
  }
  set(n, r, a) {
    const i = on(n, 0);
    return i.setFullYear(a, 0, 4), i.setHours(0, 0, 0, 0), oa(i);
  }
}
class Ng extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 130);
    ke(this, "incompatibleTokens", ["G", "y", "Y", "R", "w", "I", "i", "e", "c", "t", "T"]);
  }
  parse(n, r) {
    return Ii(r === "u" ? 4 : r.length, n);
  }
  set(n, r, a) {
    return n.setFullYear(a, 0, 1), n.setHours(0, 0, 0, 0), n;
  }
}
class Rg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 120);
    ke(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "M",
      "L",
      "w",
      "I",
      "d",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    switch (r) {
      case "Q":
      case "QQ":
        return Bt(r.length, n);
      case "Qo":
        return a.ordinalNumber(n, { unit: "quarter" });
      case "QQQ":
        return a.quarter(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.quarter(n, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQQ":
        return a.quarter(n, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQ":
      default:
        return a.quarter(n, {
          width: "wide",
          context: "formatting"
        }) || a.quarter(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.quarter(n, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  validate(n, r) {
    return r >= 1 && r <= 4;
  }
  set(n, r, a) {
    return n.setMonth((a - 1) * 3, 1), n.setHours(0, 0, 0, 0), n;
  }
}
class Ig extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 120);
    ke(this, "incompatibleTokens", [
      "Y",
      "R",
      "Q",
      "M",
      "L",
      "w",
      "I",
      "d",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    switch (r) {
      case "q":
      case "qq":
        return Bt(r.length, n);
      case "qo":
        return a.ordinalNumber(n, { unit: "quarter" });
      case "qqq":
        return a.quarter(n, {
          width: "abbreviated",
          context: "standalone"
        }) || a.quarter(n, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqqq":
        return a.quarter(n, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqq":
      default:
        return a.quarter(n, {
          width: "wide",
          context: "standalone"
        }) || a.quarter(n, {
          width: "abbreviated",
          context: "standalone"
        }) || a.quarter(n, {
          width: "narrow",
          context: "standalone"
        });
    }
  }
  validate(n, r) {
    return r >= 1 && r <= 4;
  }
  set(n, r, a) {
    return n.setMonth((a - 1) * 3, 1), n.setHours(0, 0, 0, 0), n;
  }
}
class Ag extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "Q",
      "L",
      "w",
      "I",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
    ke(this, "priority", 110);
  }
  parse(n, r, a) {
    const i = (s) => s - 1;
    switch (r) {
      case "M":
        return Yt(
          Ft(Wt.month, n),
          i
        );
      case "MM":
        return Yt(Bt(2, n), i);
      case "Mo":
        return Yt(
          a.ordinalNumber(n, {
            unit: "month"
          }),
          i
        );
      case "MMM":
        return a.month(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.month(n, { width: "narrow", context: "formatting" });
      case "MMMMM":
        return a.month(n, {
          width: "narrow",
          context: "formatting"
        });
      case "MMMM":
      default:
        return a.month(n, { width: "wide", context: "formatting" }) || a.month(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.month(n, { width: "narrow", context: "formatting" });
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 11;
  }
  set(n, r, a) {
    return n.setMonth(a, 1), n.setHours(0, 0, 0, 0), n;
  }
}
class Og extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 110);
    ke(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "Q",
      "M",
      "w",
      "I",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    const i = (s) => s - 1;
    switch (r) {
      case "L":
        return Yt(
          Ft(Wt.month, n),
          i
        );
      case "LL":
        return Yt(Bt(2, n), i);
      case "Lo":
        return Yt(
          a.ordinalNumber(n, {
            unit: "month"
          }),
          i
        );
      case "LLL":
        return a.month(n, {
          width: "abbreviated",
          context: "standalone"
        }) || a.month(n, { width: "narrow", context: "standalone" });
      case "LLLLL":
        return a.month(n, {
          width: "narrow",
          context: "standalone"
        });
      case "LLLL":
      default:
        return a.month(n, { width: "wide", context: "standalone" }) || a.month(n, {
          width: "abbreviated",
          context: "standalone"
        }) || a.month(n, { width: "narrow", context: "standalone" });
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 11;
  }
  set(n, r, a) {
    return n.setMonth(a, 1), n.setHours(0, 0, 0, 0), n;
  }
}
function Mg(e, t, n) {
  const r = Kt(e, n == null ? void 0 : n.in), a = yd(r, n) - t;
  return r.setDate(r.getDate() - a * 7), Kt(r, n == null ? void 0 : n.in);
}
class $g extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 100);
    ke(this, "incompatibleTokens", [
      "y",
      "R",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "I",
      "d",
      "D",
      "i",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    switch (r) {
      case "w":
        return Ft(Wt.week, n);
      case "wo":
        return a.ordinalNumber(n, { unit: "week" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    return r >= 1 && r <= 53;
  }
  set(n, r, a, i) {
    return Cr(Mg(n, a, i), i);
  }
}
function Fg(e, t, n) {
  const r = Kt(e, n == null ? void 0 : n.in), a = vd(r, n) - t;
  return r.setDate(r.getDate() - a * 7), r;
}
class _g extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 100);
    ke(this, "incompatibleTokens", [
      "y",
      "Y",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "w",
      "d",
      "D",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    switch (r) {
      case "I":
        return Ft(Wt.week, n);
      case "Io":
        return a.ordinalNumber(n, { unit: "week" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    return r >= 1 && r <= 53;
  }
  set(n, r, a) {
    return oa(Fg(n, a));
  }
}
const jg = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], Vg = [
  31,
  29,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];
class Ug extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 90);
    ke(this, "subPriority", 1);
    ke(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "Q",
      "w",
      "I",
      "D",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    switch (r) {
      case "d":
        return Ft(Wt.date, n);
      case "do":
        return a.ordinalNumber(n, { unit: "date" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    const a = n.getFullYear(), i = Sd(a), s = n.getMonth();
    return i ? r >= 1 && r <= Vg[s] : r >= 1 && r <= jg[s];
  }
  set(n, r, a) {
    return n.setDate(a), n.setHours(0, 0, 0, 0), n;
  }
}
class Bg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 90);
    ke(this, "subpriority", 1);
    ke(this, "incompatibleTokens", [
      "Y",
      "R",
      "q",
      "Q",
      "M",
      "L",
      "w",
      "I",
      "d",
      "E",
      "i",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    switch (r) {
      case "D":
      case "DD":
        return Ft(Wt.dayOfYear, n);
      case "Do":
        return a.ordinalNumber(n, { unit: "date" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    const a = n.getFullYear();
    return Sd(a) ? r >= 1 && r <= 366 : r >= 1 && r <= 365;
  }
  set(n, r, a) {
    return n.setMonth(0, a), n.setHours(0, 0, 0, 0), n;
  }
}
function xl(e, t, n) {
  var v, y, E, L;
  const r = pa(), a = (n == null ? void 0 : n.weekStartsOn) ?? ((y = (v = n == null ? void 0 : n.locale) == null ? void 0 : v.options) == null ? void 0 : y.weekStartsOn) ?? r.weekStartsOn ?? ((L = (E = r.locale) == null ? void 0 : E.options) == null ? void 0 : L.weekStartsOn) ?? 0, i = Kt(e, n == null ? void 0 : n.in), s = i.getDay(), u = (t % 7 + 7) % 7, p = 7 - a, g = t < 0 || t > 6 ? t - (s + p) % 7 : (u + p) % 7 - (s + p) % 7;
  return md(i, g, n);
}
class Hg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 90);
    ke(this, "incompatibleTokens", ["D", "i", "e", "c", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "E":
      case "EE":
      case "EEE":
        return a.day(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.day(n, { width: "short", context: "formatting" }) || a.day(n, { width: "narrow", context: "formatting" });
      case "EEEEE":
        return a.day(n, {
          width: "narrow",
          context: "formatting"
        });
      case "EEEEEE":
        return a.day(n, { width: "short", context: "formatting" }) || a.day(n, { width: "narrow", context: "formatting" });
      case "EEEE":
      default:
        return a.day(n, { width: "wide", context: "formatting" }) || a.day(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.day(n, { width: "short", context: "formatting" }) || a.day(n, { width: "narrow", context: "formatting" });
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 6;
  }
  set(n, r, a, i) {
    return n = xl(n, a, i), n.setHours(0, 0, 0, 0), n;
  }
}
class zg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 90);
    ke(this, "incompatibleTokens", [
      "y",
      "R",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "I",
      "d",
      "D",
      "E",
      "i",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r, a, i) {
    const s = (c) => {
      const u = Math.floor((c - 1) / 7) * 7;
      return (c + i.weekStartsOn + 6) % 7 + u;
    };
    switch (r) {
      case "e":
      case "ee":
        return Yt(Bt(r.length, n), s);
      case "eo":
        return Yt(
          a.ordinalNumber(n, {
            unit: "day"
          }),
          s
        );
      case "eee":
        return a.day(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.day(n, { width: "short", context: "formatting" }) || a.day(n, { width: "narrow", context: "formatting" });
      case "eeeee":
        return a.day(n, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":
        return a.day(n, { width: "short", context: "formatting" }) || a.day(n, { width: "narrow", context: "formatting" });
      case "eeee":
      default:
        return a.day(n, { width: "wide", context: "formatting" }) || a.day(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.day(n, { width: "short", context: "formatting" }) || a.day(n, { width: "narrow", context: "formatting" });
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 6;
  }
  set(n, r, a, i) {
    return n = xl(n, a, i), n.setHours(0, 0, 0, 0), n;
  }
}
class qg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 90);
    ke(this, "incompatibleTokens", [
      "y",
      "R",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "I",
      "d",
      "D",
      "E",
      "i",
      "e",
      "t",
      "T"
    ]);
  }
  parse(n, r, a, i) {
    const s = (c) => {
      const u = Math.floor((c - 1) / 7) * 7;
      return (c + i.weekStartsOn + 6) % 7 + u;
    };
    switch (r) {
      case "c":
      case "cc":
        return Yt(Bt(r.length, n), s);
      case "co":
        return Yt(
          a.ordinalNumber(n, {
            unit: "day"
          }),
          s
        );
      case "ccc":
        return a.day(n, {
          width: "abbreviated",
          context: "standalone"
        }) || a.day(n, { width: "short", context: "standalone" }) || a.day(n, { width: "narrow", context: "standalone" });
      case "ccccc":
        return a.day(n, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":
        return a.day(n, { width: "short", context: "standalone" }) || a.day(n, { width: "narrow", context: "standalone" });
      case "cccc":
      default:
        return a.day(n, { width: "wide", context: "standalone" }) || a.day(n, {
          width: "abbreviated",
          context: "standalone"
        }) || a.day(n, { width: "short", context: "standalone" }) || a.day(n, { width: "narrow", context: "standalone" });
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 6;
  }
  set(n, r, a, i) {
    return n = xl(n, a, i), n.setHours(0, 0, 0, 0), n;
  }
}
function Wg(e, t, n) {
  const r = Kt(e, n == null ? void 0 : n.in), a = wg(r, n), i = t - a;
  return md(r, i, n);
}
class Yg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 90);
    ke(this, "incompatibleTokens", [
      "y",
      "Y",
      "u",
      "q",
      "Q",
      "M",
      "L",
      "w",
      "d",
      "D",
      "E",
      "e",
      "c",
      "t",
      "T"
    ]);
  }
  parse(n, r, a) {
    const i = (s) => s === 0 ? 7 : s;
    switch (r) {
      case "i":
      case "ii":
        return Bt(r.length, n);
      case "io":
        return a.ordinalNumber(n, { unit: "day" });
      case "iii":
        return Yt(
          a.day(n, {
            width: "abbreviated",
            context: "formatting"
          }) || a.day(n, {
            width: "short",
            context: "formatting"
          }) || a.day(n, {
            width: "narrow",
            context: "formatting"
          }),
          i
        );
      case "iiiii":
        return Yt(
          a.day(n, {
            width: "narrow",
            context: "formatting"
          }),
          i
        );
      case "iiiiii":
        return Yt(
          a.day(n, {
            width: "short",
            context: "formatting"
          }) || a.day(n, {
            width: "narrow",
            context: "formatting"
          }),
          i
        );
      case "iiii":
      default:
        return Yt(
          a.day(n, {
            width: "wide",
            context: "formatting"
          }) || a.day(n, {
            width: "abbreviated",
            context: "formatting"
          }) || a.day(n, {
            width: "short",
            context: "formatting"
          }) || a.day(n, {
            width: "narrow",
            context: "formatting"
          }),
          i
        );
    }
  }
  validate(n, r) {
    return r >= 1 && r <= 7;
  }
  set(n, r, a) {
    return n = Wg(n, a), n.setHours(0, 0, 0, 0), n;
  }
}
class Gg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 80);
    ke(this, "incompatibleTokens", ["b", "B", "H", "k", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "a":
      case "aa":
      case "aaa":
        return a.dayPeriod(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaaa":
        return a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return a.dayPeriod(n, {
          width: "wide",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(n, r, a) {
    return n.setHours(wl(a), 0, 0, 0), n;
  }
}
class Kg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 80);
    ke(this, "incompatibleTokens", ["a", "B", "H", "k", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "b":
      case "bb":
      case "bbb":
        return a.dayPeriod(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbbb":
        return a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return a.dayPeriod(n, {
          width: "wide",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(n, r, a) {
    return n.setHours(wl(a), 0, 0, 0), n;
  }
}
class Jg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 80);
    ke(this, "incompatibleTokens", ["a", "b", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "B":
      case "BB":
      case "BBB":
        return a.dayPeriod(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBBB":
        return a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return a.dayPeriod(n, {
          width: "wide",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "abbreviated",
          context: "formatting"
        }) || a.dayPeriod(n, {
          width: "narrow",
          context: "formatting"
        });
    }
  }
  set(n, r, a) {
    return n.setHours(wl(a), 0, 0, 0), n;
  }
}
class Qg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 70);
    ke(this, "incompatibleTokens", ["H", "K", "k", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "h":
        return Ft(Wt.hour12h, n);
      case "ho":
        return a.ordinalNumber(n, { unit: "hour" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    return r >= 1 && r <= 12;
  }
  set(n, r, a) {
    const i = n.getHours() >= 12;
    return i && a < 12 ? n.setHours(a + 12, 0, 0, 0) : !i && a === 12 ? n.setHours(0, 0, 0, 0) : n.setHours(a, 0, 0, 0), n;
  }
}
class Xg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 70);
    ke(this, "incompatibleTokens", ["a", "b", "h", "K", "k", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "H":
        return Ft(Wt.hour23h, n);
      case "Ho":
        return a.ordinalNumber(n, { unit: "hour" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 23;
  }
  set(n, r, a) {
    return n.setHours(a, 0, 0, 0), n;
  }
}
class Zg extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 70);
    ke(this, "incompatibleTokens", ["h", "H", "k", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "K":
        return Ft(Wt.hour11h, n);
      case "Ko":
        return a.ordinalNumber(n, { unit: "hour" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 11;
  }
  set(n, r, a) {
    return n.getHours() >= 12 && a < 12 ? n.setHours(a + 12, 0, 0, 0) : n.setHours(a, 0, 0, 0), n;
  }
}
class eh extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 70);
    ke(this, "incompatibleTokens", ["a", "b", "h", "H", "K", "t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "k":
        return Ft(Wt.hour24h, n);
      case "ko":
        return a.ordinalNumber(n, { unit: "hour" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    return r >= 1 && r <= 24;
  }
  set(n, r, a) {
    const i = a <= 24 ? a % 24 : a;
    return n.setHours(i, 0, 0, 0), n;
  }
}
class th extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 60);
    ke(this, "incompatibleTokens", ["t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "m":
        return Ft(Wt.minute, n);
      case "mo":
        return a.ordinalNumber(n, { unit: "minute" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 59;
  }
  set(n, r, a) {
    return n.setMinutes(a, 0, 0), n;
  }
}
class nh extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 50);
    ke(this, "incompatibleTokens", ["t", "T"]);
  }
  parse(n, r, a) {
    switch (r) {
      case "s":
        return Ft(Wt.second, n);
      case "so":
        return a.ordinalNumber(n, { unit: "second" });
      default:
        return Bt(r.length, n);
    }
  }
  validate(n, r) {
    return r >= 0 && r <= 59;
  }
  set(n, r, a) {
    return n.setSeconds(a, 0), n;
  }
}
class rh extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 30);
    ke(this, "incompatibleTokens", ["t", "T"]);
  }
  parse(n, r) {
    const a = (i) => Math.trunc(i * Math.pow(10, -r.length + 3));
    return Yt(Bt(r.length, n), a);
  }
  set(n, r, a) {
    return n.setMilliseconds(a), n;
  }
}
class ah extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 10);
    ke(this, "incompatibleTokens", ["t", "T", "x"]);
  }
  parse(n, r) {
    switch (r) {
      case "X":
        return er(
          Zn.basicOptionalMinutes,
          n
        );
      case "XX":
        return er(Zn.basic, n);
      case "XXXX":
        return er(
          Zn.basicOptionalSeconds,
          n
        );
      case "XXXXX":
        return er(
          Zn.extendedOptionalSeconds,
          n
        );
      case "XXX":
      default:
        return er(Zn.extended, n);
    }
  }
  set(n, r, a) {
    return r.timestampIsSet ? n : on(
      n,
      n.getTime() - Ri(n) - a
    );
  }
}
class ih extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 10);
    ke(this, "incompatibleTokens", ["t", "T", "X"]);
  }
  parse(n, r) {
    switch (r) {
      case "x":
        return er(
          Zn.basicOptionalMinutes,
          n
        );
      case "xx":
        return er(Zn.basic, n);
      case "xxxx":
        return er(
          Zn.basicOptionalSeconds,
          n
        );
      case "xxxxx":
        return er(
          Zn.extendedOptionalSeconds,
          n
        );
      case "xxx":
      default:
        return er(Zn.extended, n);
    }
  }
  set(n, r, a) {
    return r.timestampIsSet ? n : on(
      n,
      n.getTime() - Ri(n) - a
    );
  }
}
class oh extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 40);
    ke(this, "incompatibleTokens", "*");
  }
  parse(n) {
    return Ld(n);
  }
  set(n, r, a) {
    return [on(n, a * 1e3), { timestampIsSet: !0 }];
  }
}
class sh extends Lt {
  constructor() {
    super(...arguments);
    ke(this, "priority", 20);
    ke(this, "incompatibleTokens", "*");
  }
  parse(n) {
    return Ld(n);
  }
  set(n, r, a) {
    return [on(n, a), { timestampIsSet: !0 }];
  }
}
const lh = {
  G: new Tg(),
  y: new Dg(),
  Y: new kg(),
  R: new Pg(),
  u: new Ng(),
  Q: new Rg(),
  q: new Ig(),
  M: new Ag(),
  L: new Og(),
  w: new $g(),
  I: new _g(),
  d: new Ug(),
  D: new Bg(),
  E: new Hg(),
  e: new zg(),
  c: new qg(),
  i: new Yg(),
  a: new Gg(),
  b: new Kg(),
  B: new Jg(),
  h: new Qg(),
  H: new Xg(),
  K: new Zg(),
  k: new eh(),
  m: new th(),
  s: new nh(),
  S: new rh(),
  X: new ah(),
  x: new ih(),
  t: new oh(),
  T: new sh()
}, ch = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, uh = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, dh = /^'([^]*?)'?$/, fh = /''/g, ph = /\S/, mh = /[a-zA-Z]/;
function gh(e, t, n, r) {
  var C, T, D, k;
  const a = () => on(n, NaN), i = bg(), s = i.locale ?? qa, c = i.firstWeekContainsDate ?? ((T = (C = i.locale) == null ? void 0 : C.options) == null ? void 0 : T.firstWeekContainsDate) ?? 1, u = i.weekStartsOn ?? ((k = (D = i.locale) == null ? void 0 : D.options) == null ? void 0 : k.weekStartsOn) ?? 0;
  if (!t)
    return e ? a() : Kt(n, r == null ? void 0 : r.in);
  const p = {
    firstWeekContainsDate: c,
    weekStartsOn: u,
    locale: s
  }, g = [new Sg(r == null ? void 0 : r.in, n)], v = t.match(uh).map((N) => {
    const R = N[0];
    if (R in Os) {
      const A = Os[R];
      return A(N, s.formatLong);
    }
    return N;
  }).join("").match(ch), y = [];
  for (let N of v) {
    xd(N) && Ms(N, t, e), wd(N) && Ms(N, t, e);
    const R = N[0], A = lh[R];
    if (A) {
      const { incompatibleTokens: f } = A;
      if (Array.isArray(f)) {
        const O = y.find(
          (J) => f.includes(J.token) || J.token === R
        );
        if (O)
          throw new RangeError(
            `The format string mustn't contain \`${O.fullToken}\` and \`${N}\` at the same time`
          );
      } else if (A.incompatibleTokens === "*" && y.length > 0)
        throw new RangeError(
          `The format string mustn't contain \`${N}\` and any other token at the same time`
        );
      y.push({ token: R, fullToken: N });
      const _ = A.run(
        e,
        N,
        s.match,
        p
      );
      if (!_)
        return a();
      g.push(_.setter), e = _.rest;
    } else {
      if (R.match(mh))
        throw new RangeError(
          "Format string contains an unescaped latin alphabet character `" + R + "`"
        );
      if (N === "''" ? N = "'" : R === "'" && (N = hh(N)), e.indexOf(N) === 0)
        e = e.slice(N.length);
      else
        return a();
    }
  }
  if (e.length > 0 && ph.test(e))
    return a();
  const E = g.map((N) => N.priority).sort((N, R) => R - N).filter((N, R, A) => A.indexOf(N) === R).map(
    (N) => g.filter((R) => R.priority === N).sort((R, A) => A.subPriority - R.subPriority)
  ).map((N) => N[0]);
  let L = Kt(n, r == null ? void 0 : r.in);
  if (isNaN(+L)) return a();
  const x = {};
  for (const N of E) {
    if (!N.validate(L, p))
      return a();
    const R = N.set(L, x, p);
    Array.isArray(R) ? (L = R[0], Object.assign(x, R[1])) : L = R;
  }
  return L;
}
function hh(e) {
  return e.match(dh)[1].replace(fh, "'");
}
const Td = {
  locale: {
    1: "१",
    2: "२",
    3: "३",
    4: "४",
    5: "५",
    6: "६",
    7: "७",
    8: "८",
    9: "९",
    0: "०"
  },
  number: {
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
    "०": "0"
  }
}, vh = {
  narrow: ["ईसा-पूर्व", "ईस्वी"],
  abbreviated: ["ईसा-पूर्व", "ईस्वी"],
  wide: ["ईसा-पूर्व", "ईसवी सन"]
}, yh = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["ति1", "ति2", "ति3", "ति4"],
  wide: ["पहली तिमाही", "दूसरी तिमाही", "तीसरी तिमाही", "चौथी तिमाही"]
}, bh = {
  narrow: [
    "ज",
    "फ़",
    "मा",
    "अ",
    "मई",
    "जू",
    "जु",
    "अग",
    "सि",
    "अक्टू",
    "न",
    "दि"
  ],
  abbreviated: [
    "जन",
    "फ़र",
    "मार्च",
    "अप्रैल",
    "मई",
    "जून",
    "जुल",
    "अग",
    "सित",
    "अक्टू",
    "नव",
    "दिस"
  ],
  wide: [
    "जनवरी",
    "फ़रवरी",
    "मार्च",
    "अप्रैल",
    "मई",
    "जून",
    "जुलाई",
    "अगस्त",
    "सितंबर",
    "अक्टूबर",
    "नवंबर",
    "दिसंबर"
  ]
}, wh = {
  narrow: ["र", "सो", "मं", "बु", "गु", "शु", "श"],
  short: ["र", "सो", "मं", "बु", "गु", "शु", "श"],
  abbreviated: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
  wide: [
    "रविवार",
    "सोमवार",
    "मंगलवार",
    "बुधवार",
    "गुरुवार",
    "शुक्रवार",
    "शनिवार"
  ]
}, xh = {
  narrow: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  },
  abbreviated: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  },
  wide: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  }
}, Eh = {
  narrow: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  },
  abbreviated: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  },
  wide: {
    am: "पूर्वाह्न",
    pm: "अपराह्न",
    midnight: "मध्यरात्रि",
    noon: "दोपहर",
    morning: "सुबह",
    afternoon: "दोपहर",
    evening: "शाम",
    night: "रात"
  }
}, Lh = (e, t) => {
  const n = Number(e);
  return Dd(n);
};
function Ch(e) {
  const t = e.toString().replace(/[१२३४५६७८९०]/g, function(n) {
    return Td.number[n];
  });
  return Number(t);
}
function Dd(e) {
  return e.toString().replace(/\d/g, function(t) {
    return Td.locale[t];
  });
}
const Sh = {
  ordinalNumber: Lh,
  era: Qn({
    values: vh,
    defaultWidth: "wide"
  }),
  quarter: Qn({
    values: yh,
    defaultWidth: "wide",
    argumentCallback: (e) => e - 1
  }),
  month: Qn({
    values: bh,
    defaultWidth: "wide"
  }),
  day: Qn({
    values: wh,
    defaultWidth: "wide"
  }),
  dayPeriod: Qn({
    values: xh,
    defaultWidth: "wide",
    formattingValues: Eh,
    defaultFormattingWidth: "wide"
  })
}, Th = {
  lessThanXSeconds: {
    one: "१ सेकंड से कम",
    // CLDR #1310
    other: "{{count}} सेकंड से कम"
  },
  xSeconds: {
    one: "१ सेकंड",
    other: "{{count}} सेकंड"
  },
  halfAMinute: "आधा मिनट",
  lessThanXMinutes: {
    one: "१ मिनट से कम",
    other: "{{count}} मिनट से कम"
  },
  xMinutes: {
    one: "१ मिनट",
    // CLDR #1307
    other: "{{count}} मिनट"
  },
  aboutXHours: {
    one: "लगभग १ घंटा",
    other: "लगभग {{count}} घंटे"
  },
  xHours: {
    one: "१ घंटा",
    // CLDR #1304
    other: "{{count}} घंटे"
    // CLDR #4467
  },
  xDays: {
    one: "१ दिन",
    // CLDR #1286
    other: "{{count}} दिन"
  },
  aboutXWeeks: {
    one: "लगभग १ सप्ताह",
    other: "लगभग {{count}} सप्ताह"
  },
  xWeeks: {
    one: "१ सप्ताह",
    other: "{{count}} सप्ताह"
  },
  aboutXMonths: {
    one: "लगभग १ महीना",
    other: "लगभग {{count}} महीने"
  },
  xMonths: {
    one: "१ महीना",
    other: "{{count}} महीने"
  },
  aboutXYears: {
    one: "लगभग १ वर्ष",
    other: "लगभग {{count}} वर्ष"
    // CLDR #4823
  },
  xYears: {
    one: "१ वर्ष",
    other: "{{count}} वर्ष"
  },
  overXYears: {
    one: "१ वर्ष से अधिक",
    other: "{{count}} वर्ष से अधिक"
  },
  almostXYears: {
    one: "लगभग १ वर्ष",
    other: "लगभग {{count}} वर्ष"
  }
}, Dh = (e, t, n) => {
  let r;
  const a = Th[e];
  return typeof a == "string" ? r = a : t === 1 ? r = a.one : r = a.other.replace("{{count}}", Dd(t)), n != null && n.addSuffix ? n.comparison && n.comparison > 0 ? r + "मे " : r + " पहले" : r;
}, kh = {
  full: "EEEE, do MMMM, y",
  // CLDR #1787
  long: "do MMMM, y",
  // CLDR #1788
  medium: "d MMM, y",
  // CLDR #1789
  short: "dd/MM/yyyy"
  // CLDR #1790
}, Ph = {
  full: "h:mm:ss a zzzz",
  // CLDR #1791
  long: "h:mm:ss a z",
  // CLDR #1792
  medium: "h:mm:ss a",
  // CLDR #1793
  short: "h:mm a"
  // CLDR #1794
}, Nh = {
  full: "{{date}} 'को' {{time}}",
  // CLDR #1795
  long: "{{date}} 'को' {{time}}",
  // CLDR #1796
  medium: "{{date}}, {{time}}",
  // CLDR #1797
  short: "{{date}}, {{time}}"
  // CLDR #1798
}, Rh = {
  date: aa({
    formats: kh,
    defaultWidth: "full"
  }),
  time: aa({
    formats: Ph,
    defaultWidth: "full"
  }),
  dateTime: aa({
    formats: Nh,
    defaultWidth: "full"
  })
}, Ih = {
  lastWeek: "'पिछले' eeee p",
  yesterday: "'कल' p",
  today: "'आज' p",
  tomorrow: "'कल' p",
  nextWeek: "eeee 'को' p",
  other: "P"
}, Ah = (e, t, n, r) => Ih[e], Oh = /^[०१२३४५६७८९]+/i, Mh = /^[०१२३४५६७८९]+/i, $h = {
  narrow: /^(ईसा-पूर्व|ईस्वी)/i,
  abbreviated: /^(ईसा\.?\s?पूर्व\.?|ईसा\.?)/i,
  wide: /^(ईसा-पूर्व|ईसवी पूर्व|ईसवी सन|ईसवी)/i
}, Fh = {
  any: [/^b/i, /^(a|c)/i]
}, _h = {
  narrow: /^[1234]/i,
  abbreviated: /^ति[1234]/i,
  wide: /^[1234](पहली|दूसरी|तीसरी|चौथी)? तिमाही/i
}, jh = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, Vh = {
  // eslint-disable-next-line no-misleading-character-class
  narrow: /^[जफ़माअप्मईजूनजुअगसिअक्तनदि]/i,
  abbreviated: /^(जन|फ़र|मार्च|अप्|मई|जून|जुल|अग|सित|अक्तू|नव|दिस)/i,
  wide: /^(जनवरी|फ़रवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्तूबर|नवंबर|दिसंबर)/i
}, Uh = {
  narrow: [
    /^ज/i,
    /^फ़/i,
    /^मा/i,
    /^अप्/i,
    /^मई/i,
    /^जू/i,
    /^जु/i,
    /^अग/i,
    /^सि/i,
    /^अक्तू/i,
    /^न/i,
    /^दि/i
  ],
  any: [
    /^जन/i,
    /^फ़/i,
    /^मा/i,
    /^अप्/i,
    /^मई/i,
    /^जू/i,
    /^जु/i,
    /^अग/i,
    /^सि/i,
    /^अक्तू/i,
    /^नव/i,
    /^दिस/i
  ]
}, Bh = {
  // eslint-disable-next-line no-misleading-character-class
  narrow: /^[रविसोममंगलबुधगुरुशुक्रशनि]/i,
  short: /^(रवि|सोम|मंगल|बुध|गुरु|शुक्र|शनि)/i,
  abbreviated: /^(रवि|सोम|मंगल|बुध|गुरु|शुक्र|शनि)/i,
  wide: /^(रविवार|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार)/i
}, Hh = {
  narrow: [/^रवि/i, /^सोम/i, /^मंगल/i, /^बुध/i, /^गुरु/i, /^शुक्र/i, /^शनि/i],
  any: [/^रवि/i, /^सोम/i, /^मंगल/i, /^बुध/i, /^गुरु/i, /^शुक्र/i, /^शनि/i]
}, zh = {
  narrow: /^(पू|अ|म|द.\?|सु|दो|शा|रा)/i,
  any: /^(पूर्वाह्न|अपराह्न|म|द.\?|सु|दो|शा|रा)/i
}, qh = {
  any: {
    am: /^पूर्वाह्न/i,
    pm: /^अपराह्न/i,
    midnight: /^मध्य/i,
    noon: /^दो/i,
    morning: /सु/i,
    afternoon: /दो/i,
    evening: /शा/i,
    night: /रा/i
  }
}, Wh = {
  ordinalNumber: hd({
    matchPattern: Oh,
    parsePattern: Mh,
    valueCallback: Ch
  }),
  era: Xn({
    matchPatterns: $h,
    defaultMatchWidth: "wide",
    parsePatterns: Fh,
    defaultParseWidth: "any"
  }),
  quarter: Xn({
    matchPatterns: _h,
    defaultMatchWidth: "wide",
    parsePatterns: jh,
    defaultParseWidth: "any",
    valueCallback: (e) => e + 1
  }),
  month: Xn({
    matchPatterns: Vh,
    defaultMatchWidth: "wide",
    parsePatterns: Uh,
    defaultParseWidth: "any"
  }),
  day: Xn({
    matchPatterns: Bh,
    defaultMatchWidth: "wide",
    parsePatterns: Hh,
    defaultParseWidth: "any"
  }),
  dayPeriod: Xn({
    matchPatterns: zh,
    defaultMatchWidth: "any",
    parsePatterns: qh,
    defaultParseWidth: "any"
  })
}, El = {
  code: "hi",
  formatDistance: Dh,
  formatLong: Rh,
  formatRelative: Ah,
  localize: Sh,
  match: Wh,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 4
  }
}, Yh = (e) => Object.keys(e).map(
  (t) => `${encodeURIComponent(t)}=${encodeURIComponent(e[t])}`
).join("&"), Et = (e, t, n = !1) => {
  var i;
  let r = {}, a = ((i = e.embedded) == null ? void 0 : i.contentFields) || e.contentFields || e.nestedContentFields || [];
  if (a.length > 0) {
    let s = a.find((c) => c.name == t);
    s && !n ? r = s.contentFieldValue : n && (r = a.filter(
      (c) => c.name === t && c.nestedContentFields.length > 0
    ));
  }
  return r;
}, kd = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), Gh = (e, t) => {
  if (!t) return e;
  if (e == null) return "";
  const n = t.trim().split(/\s+/).filter(Boolean), r = n.map((s) => kd(s));
  if (n.length === 0) return e;
  const a = new RegExp(`(${r.join("|")})`, "gi"), i = e.split(a).filter(Boolean);
  return /* @__PURE__ */ l.createElement(l.Fragment, null, i.map((s, c) => {
    if (!s) return null;
    const u = n.some(
      (p) => s.toLowerCase() === p.toLowerCase()
    );
    return /* @__PURE__ */ l.createElement(
      "span",
      {
        key: c,
        className: u && "etds-search-background-color"
      },
      s
    );
  }));
}, Kh = (e, t) => {
  const n = kd(t), r = new RegExp(`(${n})`, "gi"), a = (p) => p.replace(r, '<span class="highlight-search-text">$1</span>'), s = new DOMParser().parseFromString(e, "text/html").body, c = (p) => {
    if (p.nodeType === Node.COMMENT_NODE)
      return `<!--${p.nodeValue}-->`;
    if (p.nodeType === Node.TEXT_NODE)
      return t != "" ? a(p.textContent) : p.textContent;
    if (p.nodeType === Node.ELEMENT_NODE) {
      let g = "";
      for (let v of p.childNodes)
        g += c(v);
      return `<${p.nodeName.toLowerCase()}${u(
        p
      )}>${g}</${p.nodeName.toLowerCase()}>`;
    }
    return p.textContent;
  }, u = (p) => p.attributes ? Array.from(p.attributes).map((g) => ` ${g.name}="${g.value}"`).join("") : "";
  return c(s);
}, Jh = (e, t) => {
  const n = /^[0-9\b]+$/, r = e.target.value;
  return r == "" || n.test(r) && r > 0 && r <= t ? r == "" ? "" : Number(r) : 0;
}, Qh = (e) => e.key === "Enter" ? (e.preventDefault(), !0) : !1, Pd = (e, t) => {
  const n = new URL(e, window.location.origin);
  return n.searchParams.delete(t), n.toString();
}, Xh = (e) => {
  const [t, n, r] = e.split("/");
  return `${r}-${n}-${t}`;
}, Zh = (e) => {
  const t = new Date(e), n = String(t.getDate()).padStart(2, "0"), r = String(t.getMonth() + 1).padStart(2, "0"), a = t.getFullYear();
  return `${n}/${r}/${a}`;
}, ev = (e, t = "MMMM do, yyyy") => {
  if (!e || !yl(new Date(e)))
    return "";
  const n = Liferay.ThemeDisplay.getLanguageId(), r = n === "hi_IN" ? El : qa;
  return n === "hi_IN" && (t = t.replace(/do/g, "d")), eo(new Date(e), t, { locale: r });
}, tv = (e) => {
  if (!e) return "";
  const t = new Date(e), n = { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" };
  return t.toLocaleDateString("en-GB", n).replace(/ /g, "-");
}, nv = () => 'No\x20Match\x20Found', rv = (e, t) => {
  if (!e) return "";
  const n = e.split(t);
  return n[n.length - 1].trim();
}, av = (e = "") => (e == null ? void 0 : e.trim().length) < 3 || e.trim() == "", Ll = (e, t = {}) => {
  t != null && t.erc || console.error("Blueprint external reference code is empty.....");
  const n = {
    "search.empty.search": t.emptySearch !== !1,
    "search.experiences.blueprint.external.reference.code": t.erc
  }, r = Object.entries(e).reduce(
    (a, [i, s]) => (s != null && (a[`search.experiences.${i}`] = s), a),
    {}
  );
  return { attributes: { ...n, ...r } };
};
function iv(e) {
  return new Promise((t) => {
    const n = new Image();
    n.src = e, n.decode ? n.decode().then(t).catch(t) : (n.onload = t, n.onerror = t);
  });
}
const $s = (e, t) => {
  const n = "iframe" + e, r = document.querySelector(
    ".header-wrapper .header .logo-wrap"
  ).outerHTML;
  for (; document.getElementById(n) != null; )
    document.getElementById(n).remove();
  const a = document.getElementById(e);
  if (!a) return;
  const i = lv(cv(a.outerHTML));
  try {
    const s = document.createElement("iframe");
    s.id = n, s.style.display = "none", s.style.width = "100%", document.body.appendChild(s), t.current = s;
    let c = "Income-Tax-Department.svg";
    themeDisplay.getBCP47LanguageId() == "hi-IN" && (c = "Income-Tax-Department-Hindi.svg");
    const u = "/o/etds-theme-css/assets/images/" + c;
    s.onload = function() {
      const p = t.current.contentDocument || t.current.contentWindow.document;
      p.open(), p.write(ov({ headerHtml: r, contentHtml: i })), p.close(), sv(p).then(() => iv(u)).then(() => new Promise((g) => setTimeout(g, 100))).then(() => {
        const g = t.current.contentWindow;
        g.focus(), g.print();
      }).finally(() => {
        t.current.contentWindow.onafterprint = () => {
        };
      });
    }, s.src = "about:blank";
  } catch (s) {
    console.error("Error generating PDF:", s);
  }
};
function ov({ headerHtml: e, contentHtml: t }) {
  var a, i;
  const n = (a = document.querySelector("#liferayAUICSS")) == null ? void 0 : a.getAttribute("href"), r = (i = document.querySelector("#liferayThemeCSS")) == null ? void 0 : i.getAttribute("href");
  return `
    <!DOCTYPE html>
    <html data-contrast="off" lang="${themeDisplay.getBCP47LanguageId()}">
    <head>
      <meta charset="UTF-8" />
      <title>${'Income\x20Tax\x20Department'}</title>

      ${n ? `<link rel="stylesheet" href="${n}" />` : ""}
      ${r ? `<link rel="stylesheet" href="${r}" />` : ""}

      <style>
        @media (max-width: 991.98px) {
          .header-wrapper .site-meta {
            display: block !important;
          }
          .header-wrapper .site-meta .department-name,
          .header-wrapper .site-meta .department-tagline, {
            font-style: normal;
          }
          .header-wrapper .header .logo-wrap .logo img{  
            width: 136px !important;
            height: 92px !important;
            max-height: unset !important;
            max-width: unset !important;
          }
          .parallel-viewer-content-container .section-data {
            margin: 0;
          }
        }
         
        .header-wrapper .header .logo-wrap .logo img{  
          width: 136px !important;
          height: 92px !important;
          max-height: unset !important;
        }
        .header-wrapper .header .logo-wrap .site-meta .department-name{
          font-size: 19px;
          line-height: 1;
          color: #626265;
        }
        .header-wrapper .header .logo-wrap .site-meta .department-tagline{
          font-size: 13px;
          color: #626265;
        }

        .parallel-viewer-content-container .selected-content-viewer {
          align-items: start !important;
        }

        .parallel-viewer-content-container .change-section,
        .parallel-viewer-content-container .btn-open-in-new-tab {
          display: none !important;
        }

        .parallel-viewer-content-container .text-truncate {
          white-space: unset !important;
        }

        .parallel-viewer-content-container .section-data {
          background-color: #F3F7FD;
          padding: 0.5rem;
          margin: 1rem;
        }

        .content-comparision-view{
          .taglib-diff-html {
            span.diff-html-added {
              background-color: #cfc;
              font-size: 1em;
            }
            span.diff-html-removed {
              background-color: #fdc6c6;
              font-size: 1em;
              text-decoration: none !important;
            }
            span.diff-html-changed {
              background-image: none;
              border-bottom: none;
          }
        }

        .content-comparision-reversed-view{
          .taglib-diff-html {
            span.diff-html-added {
              background-color: #fdc6c6 !important;
              font-size: 1em;
            }
            span.diff-html-removed {
              background-color: #cfc !important;
              font-size: 1em;
              text-decoration: none !important;
            }
            span.diff-html-changed {
              background-image: none;
              border-bottom: none;
          }
        }

        @media print {
          a[href]:after {
            content: "";
          }
        }
      </style>
    </head>
    <body class="printing">
      <div class="print-watermark"></div>
      <header class="header-wrapper p-0 mb-4 pb-3">
        <div class="header">
          ${e || ""}
        </div>
      </header>

      ${t}
    </body>
    </html>
  `;
}
function sv(e) {
  return new Promise((t) => {
    const n = Array.from(
      e.querySelectorAll('link[rel="stylesheet"]')
    );
    if (n.length === 0) {
      t();
      return;
    }
    let r = 0;
    const a = () => {
      r++, r === n.length && t();
    };
    n.forEach((i) => {
      i.sheet ? a() : (i.onload = a, i.onerror = a);
    });
  });
}
function lv(e) {
  if (!e) return e;
  const n = new DOMParser().parseFromString(e, "text/html");
  return n.querySelectorAll("style").forEach((r) => {
    let a = r.textContent || "";
    a = a.replace(/<!--|-->/g, ""), a = a.replace(/@page\s+[a-zA-Z0-9_-]+\s*\{[\s\S]*?\}/gi, "").replace(
      /([.#]?[a-zA-Z0-9_-]+|\w+\.[a-zA-Z0-9_-]+)\s*\{\s*page\s*:\s*[a-zA-Z0-9_-]+\s*;\s*\}/gi,
      ""
    ).replace(/mso-[a-z-]+\s*:\s*[^;]+;/gi, ""), r.textContent = a.trim();
  }), n.documentElement.outerHTML;
}
function cv(e) {
  const n = new DOMParser().parseFromString(e, "text/html");
  return n.querySelectorAll(
    "meta, script, link, title"
  ).forEach((r) => r.remove()), n.body.innerHTML.trim();
}
const uv = "RELATED_CONTENT_DATA_BP_ERC", dv = (e) => {
  const t = e.replace(/([?&])download=true(&|$)/, "$1").replace(/[?&]$/, "");
  window.open(t, "_blank", "noopener,noreferrer");
}, fv = async (e = ["Features", "Act"]) => {
  try {
    const n = (await Promise.all(
      e.map((a) => Ve.getCategoriesByVocabularyName(a))
    )).flat().filter((a) => {
      var s;
      return !((s = a.taxonomyCategoryProperties) == null ? void 0 : s.some(
        (c) => c.key === "RelatedContentExcluded" && c.value === "true"
      ));
    });
    return new Map(n.map((a) => [String(a.id), a]));
  } catch (t) {
    return console.error("Error fetching related content categories:", t), /* @__PURE__ */ new Map();
  }
}, Cl = (e, t) => {
  if (!e || !t) return null;
  const n = Array.isArray(t.taxonomyCategoryBriefs) ? t.taxonomyCategoryBriefs : [];
  for (const r of n) {
    const a = String((r == null ? void 0 : r.taxonomyCategoryId) ?? ""), i = e.get(a);
    if (i && i.name) return i.name;
  }
  return null;
}, pv = async (e, t, n, r) => {
  if (r.has(e))
    return r.get(e);
  const a = Ll(
    { related_content_id: e },
    { emptySearch: !0, erc: uv }
  ), i = await Ve.getSearchResults(a, {
    nestedFields: "embedded",
    fields: "embedded.contentUrl,title,itemURL,embedded.contentFields,friendlyUrlPath,embedded.friendlyUrlPath",
    search: n,
    restrictFields: "actions,creator",
    pageSize: -1
  });
  return i.totalCount > 0 ? (r.set(e, i.items[0]), i.items[0]) : null;
}, mv = (e, t) => {
  const n = [];
  for (let r = 0; r < e.length; r += t)
    n.push(e.slice(r, r + t));
  return n;
};
async function gv(e = []) {
  var a, i;
  if (!(e != null && e.length)) return [];
  const t = await Liferay.Util.fetch(
    "/o/search/v1.0/search?restrictFields=actions%2Ccreator&fields=embedded.taxonomyCategoryBriefs,itemURL",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          "search.empty.search": !0,
          "search.experiences.blueprint.external.reference.code": "RELATED_FEATURE_COUNTS_BP_ERC",
          "search.experiences.related_content_ids": e.join(",")
        }
      })
    }
  );
  if (!t.ok) return [];
  const n = await t.json();
  return (((i = (a = n == null ? void 0 : n.aggregations) == null ? void 0 : a.related_contents) == null ? void 0 : i.buckets) || []).map((s) => ({ id: String(s.key), count: s.docCount || 0 }));
}
const hv = [
  "Sections",
  "Rules",
  "Forms",
  "Charts and Tables",
  "Tutorials",
  "Tools",
  "FAQ",
  "Finance Acts",
  "Circulars",
  "Notification",
  "Tax Calendar",
  "Tax Services"
];
function vv(e, t, n, r = Liferay.ThemeDisplay.getLanguageId()) {
  const a = t.map(({ id: u, count: p }) => {
    var E, L;
    const g = e.get(String(u));
    if (!g) return null;
    const v = g.name_i18n && (g.name_i18n[r] || g.name_i18n.en_US) || g.name || String(u), y = ((L = (E = g == null ? void 0 : g.taxonomyCategoryProperties) == null ? void 0 : E.find(
      (x) => (x == null ? void 0 : x.key) === "sortName"
    )) == null ? void 0 : L.value) || v;
    return { id: String(u), name: v, count: p, sortName: y };
  }).filter(Boolean), i = new Map(n ? n.map((u, p) => [u.toLowerCase(), p]) : hv.map((u, p) => [u.toLowerCase(), p])), s = [], c = [];
  for (const u of a) {
    const p = i.get(u.sortName.toLowerCase());
    typeof p == "number" ? s.push({ ...u, __i: p }) : c.push(u);
  }
  return s.sort((u, p) => u.__i - p.__i), c.sort((u, p) => u.sortName.localeCompare(p.sortName)), [...s.map(({ __i: u, ...p }) => p), ...c];
}
function Nd(e) {
  const t = (e || "").toLowerCase();
  return t === "circulars" || t === "circular" || t === "notifications" || t === "notification" || t === "tax calendar" ? {
    bpERC: "RELATED_ITEMS_DATE_BP_ERC",
    sortOrder: "desc"
  } : { bpERC: "RELATED_ITEMS_PRIORITY_BP_ERC", sortOrder: "asc" };
}
function Qo(e) {
  const t = Liferay.ThemeDisplay.getBCP47LanguageId(), n = new Date(e), r = t === "hi-IN" ? "hi-IN" : "en-GB", a = n.toLocaleDateString(r, {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  return String(a);
}
function yv(e, t, n, r) {
  var a, i, s, c, u, p, g, v, y, E, L, x, C, T, D, k, N;
  if (n.toLowerCase() === "rules")
    return String(t) + ((a = Et(e, "ruleShortDescription")) != null && a.data ? " : " + ((i = Et(e, "ruleShortDescription")) == null ? void 0 : i.data) : "");
  if (n.toLowerCase() === "forms")
    return String((s = Et(e, "formNumber")) != null && s.data ? (c = Et(e, "formNumber")) == null ? void 0 : c.data : t + "") + ((u = Et(e, "formDescription")) != null && u.data ? " - " + ((p = Et(e, "formDescription")) == null ? void 0 : p.data) : "");
  if (n.toLowerCase() === "charts and tables" || n.toLowerCase() === "tutorials")
    return String(t);
  if (n.toLowerCase() === "finance acts") {
    const R = e.taxonomyCategoryBriefs.find(
      (f) => r.has(String(f.taxonomyCategoryId))
    ), A = R ? R.taxonomyCategoryName : "";
    return String(t) + (A ? " : " + A : "");
  }
  if (n.toLowerCase() === "circulars" || n.toLowerCase() === "circular")
    return String((g = Et(e, "circularNotificationNumber")) != null && g.data ? (v = Et(e, "circularNotificationNumber")) == null ? void 0 : v.data : t + "") + ((y = Et(e, "circularNotificationDate")) != null && y.data ? " : " + Qo((E = Et(e, "circularNotificationDate")) == null ? void 0 : E.data) : "");
  if (n.toLowerCase() === "notification" || n.toLowerCase() === "notifications")
    return String((L = Et(e, "circularNotificationNumber")) != null && L.data ? (x = Et(e, "circularNotificationNumber")) == null ? void 0 : x.data : t + "") + ((C = Et(e, "circularNotificationDate")) != null && C.data ? " : " + Qo((T = Et(e, "circularNotificationDate")) == null ? void 0 : T.data) : "");
  if (n.toLowerCase() === "tax calendar") {
    const R = (D = Et(e, "shortDescription")) != null && D.data ? Et(e, "shortDescription").data : "", A = document.createElement("div");
    A.innerHTML = R;
    const _ = (A.textContent || A.innerText || "").replace(/\s+/g, " ").trim();
    return String((k = Et(e, "dueDate")) != null && k.data ? Qo((N = Et(e, "dueDate")) == null ? void 0 : N.data) : t + "") + (_ ? " - " + _ : "");
  }
  return String(t);
}
async function bv({
  relatedContentMap: e,
  featureCategoryId: t,
  featureName: n,
  page: r = 1,
  pageSize: a = 50,
  search: i,
  yearCategories: s,
  fSortName: c,
  circularId: u = "",
  notificationId: p = ""
}) {
  console.debug("Getting items for - " + n + " and sortName " + c);
  const g = Array.from((e || /* @__PURE__ */ new Map()).keys());
  if (!g.length) return { results: [], hasMore: !1 };
  const { bpERC: v, sortOrder: y } = Nd(c);
  let E = "";
  c === "circulars" || c === "circular" ? E = u : (c === "notifications" || c === "notification") && (E = p);
  const L = await Liferay.Util.fetch(
    `/o/search/v1.0/search?page=${r}&pageSize=${a}&restrictFields=actions%2Ccreator&nestedFields=embedded&fields=embedded.taxonomyCategoryBriefs,embedded.contentFields,itemURL,title&search=${i || ""}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId() },
      body: JSON.stringify({
        attributes: {
          "search.empty.search": !0,
          "search.experiences.blueprint.external.reference.code": v,
          "search.experiences.related_content_ids": g.join(","),
          "search.experiences.feature_category_id": String(t),
          "search.experiences.sortOrder": y,
          "search.experiences.structure_id": E
        }
      })
    }
  );
  if (!L.ok) return { results: [], hasMore: !1 };
  const x = await L.json();
  return {
    results: (Array.isArray(x == null ? void 0 : x.items) ? x.items : []).map((D) => {
      var f, _;
      const k = (f = ((D == null ? void 0 : D.itemURL) || "").match(/\/(\d+)$/)) == null ? void 0 : f[1];
      if (!k) return null;
      const N = e.get(String(k)), R = (N == null ? void 0 : N.contentType) || "", A = (((_ = D == null ? void 0 : D.embedded) == null ? void 0 : _.taxonomyCategoryBriefs) || []).map((O) => String((O == null ? void 0 : O.taxonomyCategoryId) || "")).filter(Boolean).join(",");
      return {
        id: k,
        entryClassPK: k,
        title: yv(D == null ? void 0 : D.embedded, D == null ? void 0 : D.title, c, s),
        contentType: R,
        catIds: A,
        embedded: D == null ? void 0 : D.embedded
      };
    }).filter(Boolean),
    hasMore: ((x == null ? void 0 : x.page) ?? 1) < ((x == null ? void 0 : x.lastPage) ?? 1)
  };
}
const wv = async (e, t, n, r, a) => {
  var v;
  if (!e) return [];
  const i = `${e.id}_${t}`;
  if (r.has(i))
    return r.get(i);
  if (!((v = e == null ? void 0 : e.relatedContentsMap) != null && v.size))
    return [];
  const s = [...e.relatedContentsMap.keys()], c = mv(s, 500), u = [];
  (await Promise.all(
    c.map(async (y) => {
      const E = y.join(","), L = Ll(
        { related_content_ids: E },
        { emptySearch: !0, erc: "RELATED_CONTENT_MINIMAL_ERC" }
      ), x = await Ve.getSearchResults(L, {
        search: t,
        restrictFields: "actions,creator",
        pageSize: -1,
        nestedFields: "embedded",
        page: 1,
        fields: "embedded.taxonomyCategoryBriefs,title,itemURL"
      });
      return (x == null ? void 0 : x.items) || [];
    })
  )).forEach((y) => u.push(...y));
  const g = xv(
    u,
    n,
    e
  );
  return r.set(i, g), g;
}, xv = (e, t, n) => {
  const r = {
    relatedContents: []
  }, a = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
  e.forEach((c) => {
    var L, x, C, T, D;
    const u = (L = c.itemURL) == null ? void 0 : L.match(/\/(\d+)$/), p = u ? u[1] : null, g = c.title;
    if (!p || !g) return;
    const v = n.relatedContentsMap.get(String(p));
    if (!v || i.has(p)) return;
    i.add(p);
    const y = ((C = (x = c.embedded) == null ? void 0 : x.taxonomyCategoryBriefs) == null ? void 0 : C.filter(
      (k) => t.has(String(k.taxonomyCategoryId))
    )) || [], E = (((T = c.embedded) == null ? void 0 : T.taxonomyCategoryBriefs) || []).map((k) => String(k.taxonomyCategoryId)).filter(Boolean);
    if (y.length === 0) {
      r.relatedContents.push({
        entryClassPK: p,
        title: g,
        contentType: v.contentType,
        catIds: E.join(","),
        taxonomyCategoryBriefs: ((D = c.embedded) == null ? void 0 : D.taxonomyCategoryBriefs) || []
      });
      return;
    }
    y.forEach((k) => {
      var A;
      const N = t.get(
        String(k.taxonomyCategoryId)
      );
      if (!N) return;
      a.has(N.id) || a.set(N.id, {
        id: N.id,
        name: N.name,
        taxonomyCategoryProperties: N.taxonomyCategoryProperties,
        docCount: 0,
        relatedContents: []
      }), a.get(N.id).relatedContents.push({
        entryClassPK: p,
        title: g,
        contentType: v.contentType,
        catIds: E.join(","),
        taxonomyCategoryBriefs: ((A = c.embedded) == null ? void 0 : A.taxonomyCategoryBriefs) || []
      });
    });
  });
  const s = Array.from(a.values()).filter(
    (c) => c.relatedContents.length > 0
  );
  return s.forEach((c) => {
    c.docCount = c.relatedContents.length;
  }), s;
}, Rd = (e = 'etds-content-updated', t = "global-aria-live") => {
  const n = document.getElementById(t) || document.querySelector(".global-aria-live");
  n && (n.textContent = e, setTimeout(() => {
    n.textContent = "";
  }, 2e3));
}, Ev = () => {
  let e = document.querySelector(".document-viewer-wrapper .doc-view-sidebar"), t = document.querySelector(".document-viewer-wrapper .doc-view-section"), n = document.getElementById("sidebar-modal-btn"), r = e == null ? void 0 : e.classList.toggle("collapsed");
  t == null || t.classList.toggle("collapsed"), n && n.setAttribute(
    "aria-label",
    r ? 'Open\x20Menu' : 'Close\x20Menu'
  );
}, Lv = () => {
  let e = document.querySelector(".document-viewer-wrapper .doc-view-sidebar"), t = document.querySelector(".document-viewer-wrapper .doc-view-section"), n = document.getElementById("sidebar-modal-btn");
  e == null || e.classList.remove("collapsed"), t == null || t.classList.remove("collapsed"), n && n.setAttribute(
    "aria-label",
    'Close\x20Menu'
  );
}, Cv = (e) => {
  const t = 'Footnote\x20closed';
  Rd(t, "footnote-aria-live");
  const r = e.currentTarget.closest(".html-content-viewer"), a = (r == null ? void 0 : r.querySelector("#footnoteSection")) || document.querySelector("#footnoteSection");
  a == null || a.classList.add("d-none");
  const i = document.activeElementBeforeFootnote;
  i == null || i.focus();
}, Id = async (e, t, n, r = "") => {
  const a = {
    sort: `name:${t}`
  }, i = await Ve.getCategoriesByVocabularyName(
    e,
    a,
    r
  );
  if ((i == null ? void 0 : i.length) > 0) {
    const s = [];
    return n && s.push({
      id: "0",
      name: 'All'
    }), i.forEach(
      (c) => s.push({
        id: c.id,
        name: c.name
      })
    ), s;
  }
  return [];
}, Sv = async (e, t, n) => {
  var i;
  const r = {
    sort: `name:${t}`,
    page: 1,
    pageSize: -1
  }, a = await Ve.fetchPickListByERC(e, r);
  if (((i = a == null ? void 0 : a.items) == null ? void 0 : i.length) > 0) {
    const s = [];
    return n && s.push({
      id: "0",
      name: 'All'
    }), a.items.forEach((c) => {
      s.push({
        id: c.key,
        name: c.name
      });
    }), s;
  }
  return [];
}, Tv = async (e, t, n) => {
  var i;
  const r = {
    sort: `name:${t}`,
    page: 1,
    pageSize: -1
  }, a = await Ve.fetchPickListByERC(e, r);
  if (((i = a == null ? void 0 : a.items) == null ? void 0 : i.length) > 0) {
    const s = [];
    return n && s.push({
      id: "0",
      name: 'All',
      erc: "ALL"
    }), a.items.forEach((c) => {
      s.push({
        id: c.key,
        name: c.name,
        erc: c.externalReferenceCode
      });
    }), s;
  }
  return [];
}, Dv = (e) => {
  const t = e.split("v=")[1];
  return t ? t.split("&")[0] : null;
}, Ad = (e) => new URLSearchParams(window.location.search).getAll(e) || "", kv = async (e) => {
  let t = await Ve.fetchDocumentByDocumentId(e);
  return !t || !(t != null && t.contentUrl) ? (console.warn("Unable to get the Document URL for Document Id: " + e), !1) : (window.open(Pd(t == null ? void 0 : t.contentUrl, "download"), "_blank"), !0);
}, Pv = async (e, t) => {
  try {
    const n = e || "Year", r = await Ve.getCategoriesByVocabularyName(n, {});
    if (t.length === 0)
      return r;
    const a = new Set(t.map((s) => s.key)), i = r.filter(
      (s) => a.has(String(s.id))
    );
    return i.length > 0 ? i : r;
  } catch (n) {
    return console.error("Failed to fetch categories:", n), [];
  }
}, Sl = (e) => {
  if (!e) return;
  const t = window.open(e, "_blank");
  t ? t.onload = function() {
    t.focus(), t.print();
  } : console.error("Failed to open window for printing PDF");
}, to = async (e, t, n = "", r = !1) => {
  try {
    if (n ? await window.openDocumentViewer("Others", "articleId", n) : await window.openDocumentViewer("Others", "itemUrl", e), r) return;
    const a = setTimeout(() => {
      throw i.disconnect(), new Error(
        "Document viewer popup failed to appear within expected time"
      );
    }, 1e4), i = new MutationObserver((s, c) => {
      const u = document.querySelector('[id^="doc-key-"]');
      if (u) {
        clearTimeout(a), c.disconnect();
        const p = u.id;
        if (!t)
          throw new Error("Print frame reference is not available");
        if (!$s)
          throw new Error("ETDS print utility is not available");
        $s(p, t);
      }
    });
    return i.observe(document.body, {
      childList: !0,
      subtree: !0
    }), () => {
      clearTimeout(a), i.disconnect();
    };
  } catch (a) {
    throw console.error("Failed to print document:", a), a;
  }
}, Od = (e, t = []) => {
  const n = (e == null ? void 0 : e.contentFields) || [], r = [];
  return n.forEach((a) => {
    const i = a == null ? void 0 : a.nestedContentFields;
    if (Array.isArray(i) && i.length > 0) {
      const s = {};
      t.forEach((c) => {
        const u = i.find((p) => p.name === c);
        u && u.contentFieldValue && (s[c] = u.contentFieldValue);
      }), Object.keys(s).length > 0 && r.push(s);
    }
  }), r;
}, Nv = async (e) => {
  const t = [], n = e.split(",").map((r) => r.trim()).filter(Boolean);
  for (const r of n)
    try {
      const a = await Ve.getJournalArticleById(r);
      a && Od(a, ["name", "linkToPage", "title"]).forEach((s) => {
        var c, u, p;
        t.push({
          name: ((c = s == null ? void 0 : s.name) == null ? void 0 : c.data) || "",
          url: ((u = s == null ? void 0 : s.linkToPage) == null ? void 0 : u.link) || "",
          title: ((p = s == null ? void 0 : s.title) == null ? void 0 : p.data) || ""
        });
      });
    } catch (a) {
      console.error(`Error fetching article with id ${r}`, a);
    }
  return t;
}, Rv = async () => {
  const e = Ad("related_content_Id");
  let t = [];
  if (Array.isArray(e) && e.length > 0) {
    const n = {
      fields: "relatedContents"
    };
    try {
      t = (await Promise.all(
        e.map(async (a) => (await Ve.getJournalArticleById(a, n)).relatedContents)
      )).flat().map((a) => a.id);
    } catch (r) {
      console.error("Error fetching related contents:", r);
    }
  }
  return t;
}, Md = async (e, t, n) => {
  var a;
  let r = "";
  try {
    if (t.current[e])
      r = t.current[e];
    else {
      const i = Liferay.ThemeDisplay.getSiteGroupId(), s = await Liferay.Util.fetch(
        `${Ve.getNodeHomePageUrl()}/etds/n/generatePDFByArticleId/sites/${i}/articleId/${e}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          },
          body: JSON.stringify({
            liferayThemeCSSPath: ((a = document.querySelector("#liferayThemeCSS")) == null ? void 0 : a.getAttribute("href")) || "",
            pdfWaterMarkUrl: n
          })
        }
      );
      if (!s.ok) {
        const u = await s.text();
        console.error("Download API Error:", u);
        return;
      }
      const c = await s.json();
      if (!c.pdfUrl) {
        console.error("Invalid response: pdfUrl is missing.");
        return;
      }
      r = c.pdfUrl, t.current[e] = r;
    }
    r && r.trim() !== "" ? window.open(`${themeDisplay.getPortalURL()}${r}`, "_blank") : console.warn("PDF URL is empty.");
  } catch (i) {
    console.error("Unexpected error during PDF download:", i);
  }
}, Iv = async (e, t, n) => {
  const r = await Ve.fetchContentStructureFieldsById(e);
  if (!(r != null && r.contentStructureFields)) return [];
  const a = r.contentStructureFields.find(
    (s) => s.label === t
  );
  if (!a || !a.options) return [];
  const i = [];
  return a.options.forEach((s) => {
    i.push({
      value: s.value,
      label: s.label
    });
  }), i.sort(
    (s, c) => s.label.localeCompare(c.label, void 0, { sensitivity: "base" })
  ), n && i.unshift({
    value: "0",
    label: 'All'
  }), i;
}, Av = (e, t, n) => {
  try {
    const r = gh(e, t, /* @__PURE__ */ new Date());
    return eo(r, n);
  } catch {
    return e;
  }
}, Tc = {}, $d = async (e, t, n = !1, r = "selectType", a = "pdf", i = "content", s = "reportFile", c = "documentContent") => {
  var u, p, g;
  try {
    if (!e) return;
    let v = Tc[e];
    if (!v) {
      const E = {
        restrictFields: "actions"
      };
      v = await Ve.fetchContentById(e, E), Tc[e] = v;
    }
    let y = ((u = Et(v, r)) == null ? void 0 : u.value) || "";
    if (y == "" && (y = c), y === a) {
      const E = (g = (p = Et(v, s)) == null ? void 0 : p.document) == null ? void 0 : g.contentUrl, L = E ? `${themeDisplay.getPortalURL()}${E}` : null;
      if (L && n) {
        Sl(L);
        return;
      } else if (E) {
        window.open(E, "_blank");
        return;
      }
    }
    to("", t, e, !n);
    return;
  } catch (v) {
    console.debug("Error while fetching Content " + v);
  }
}, Ov = (e, t) => !Array.isArray(e) || !Array.isArray(t) ? null : e.find((n) => {
  const r = n.value ?? n.id;
  return t.some(
    (a) => a.taxonomyCategoryId == r
  );
}), Mv = async ({
  record: e,
  download: t = !1,
  setIsLoading: n = () => {
  },
  downloadUrlCache: r = null,
  pdfWaterMarkUrl: a = "/documents/d/guest/etds-logo"
}) => {
  var s, c, u, p;
  const i = ((s = Et(e, "selectType")) == null ? void 0 : s.value) || "";
  if (i === "reportFile") {
    const g = (u = (c = Et(e, "reportFile")) == null ? void 0 : c.document) == null ? void 0 : u.contentUrl, v = g ? `${themeDisplay.getPortalURL()}${g}` : null;
    v && t ? window.open(v + "?download=true", "_self") : g && window.open(g, "_blank");
    return;
  }
  if (i === "documentContent") {
    if (t)
      try {
        window.showLoader(), n(!0), await Md(
          e.embedded.id,
          r,
          a
        );
      } catch (g) {
        console.error("Download failed:", g);
      } finally {
        window.hideLoader(), n(!1);
      }
    else
      window.openDocumentViewer("Others", "itemUrl", e.itemURL);
    return;
  }
  if (i === "linkToPage") {
    const g = (p = Et(e, "linkToPage")) == null ? void 0 : p.data;
    g && window.open(g, "_blank");
  }
}, $v = async ({ logOutURL: e }) => {
  try {
    (await Liferay.Util.fetch("/c/portal/logout", {
      method: "POST"
    })).ok && Liferay.Util.navigate(e);
  } catch (t) {
    console.error("Logout failed:", t);
  }
}, Fv = (e, t = 500) => e ? e.length > t ? e.slice(0, t) + "…" : e : "", _v = async (e, t) => {
  if (e.includes("/")) {
    window.open(e, "_blank");
    return;
  } else {
    const r = (await Ve.getStructuredContentByFriendlyUrl(e)).items[0];
    to(
      "",
      t,
      r.id,
      !0
    );
  }
  return "";
}, jv = async (e, t) => {
  const n = {
    CMSID: "CMSID",
    ARTICLE_KEY: "articleKey",
    ARTICLE_ID: "articleId",
    ITEM_URL: "itemUrl",
    FRIENDLY_URL: "friendlyUrl",
    FRIENDLY_URL_PATH: "friendlyUrlPath",
    ARTICLE_FRIENDLY_URL: "articleFriendlyUrl"
  };
  let r = "";
  const a = e == null ? void 0 : e.toLowerCase();
  try {
    if (window.showLoader(), a === n.CMSID.toLowerCase())
      r = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/structured-contents?page=1&pageSize=1&flatten=true&search=${t}`;
    else if (a === n.ARTICLE_KEY.toLowerCase())
      r = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/structured-contents/by-key/${t}`;
    else if (a === n.ARTICLE_ID.toLowerCase())
      r = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/structured-contents/${t}`;
    else if (a === n.ITEM_URL.toLowerCase() || a === n.FRIENDLY_URL.toLowerCase() || a === n.FRIENDLY_URL_PATH.toLowerCase())
      r = t;
    else if (a === n.ARTICLE_FRIENDLY_URL.toLowerCase()) {
      const c = {
        filter: `friendlyUrlPath eq '${t}'`,
        pageSize: 1,
        restrictFields: "actions"
      }, u = F.createQueryString(c);
      r = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/structured-contents?${u}`, console.debug("Generated Friendly URL Path:", r);
    } else
      return console.warn("Please select a valid field name"), null;
    const i = await Liferay.Util.fetch(r, {
      method: "GET",
      headers: {
        "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
      }
    });
    return i.ok ? await i.json() : (console.error(`Failed to fetch structured content. Status: ${i.status}`), null);
  } catch (i) {
    console.debug("Error fetching structured content:", i);
  } finally {
    window.hideLoader();
  }
  return null;
}, Fs = async (e, t, n, r = "", a = !1) => {
  try {
    const i = {
      destinationFriendlyURL: r,
      plid: t,
      search: n.id
    }, s = [
      {
        attributes: {
          sxpBlueprintExternalReferenceCode: "KMS_SUGGESTIONS_BP_ERC",
          ...(n == null ? void 0 : n.id) && { "search.experiences.entry_class_PK": n.id }
        },
        contributorName: "sxpBlueprint",
        size: "1"
      }
    ], u = (await Ve.getSearchSuggestionResults(
      s,
      i
    )).items[0].suggestions[0].attributes.assetURL || "";
    if (u) {
      const g = new URL(u).searchParams.get("_com_liferay_portal_search_web_search_results_portlet_SearchResultsPortlet_assetEntryId");
      g > 0 && (a ? Fd(`${Liferay.ThemeDisplay.getPortalURL()}/${e}${g}`) : window.open(`/${e}${g}`, "_blank"));
    }
  } catch (i) {
    console.debug("Failed to load Search Suggestions ", i);
  }
}, Vv = ({
  article: e = "",
  kmsDefaultRedirection: t = "",
  kmsGroupId: n = "",
  plid: r = "",
  ccdgaDefaultRedirection: a = "",
  ccdgaPlid: i = "",
  emailRedirection: s = !1,
  kmsURL: c = "",
  ccdgaURL: u = ""
}) => {
  (e == null ? void 0 : e.siteId) != Liferay.ThemeDisplay.getScopeGroupId() && (e == null ? void 0 : e.siteId) != n ? Fs(a, i, e, u, s) : (e == null ? void 0 : e.siteId) != Liferay.ThemeDisplay.getScopeGroupId() ? Fs(t, r, e, c, s) : e != null && e.friendlyUrlPath && (s ? Fd(`${Liferay.ThemeDisplay.getPortalURL()}/w/${e.friendlyUrlPath}`) : window.open(`/w/${e == null ? void 0 : e.friendlyUrlPath}`, "_blank"));
}, Fd = (e = "") => {
  const t = 'Income\x20tax\x20Document', n = 'Dear\x20Sir\x2fmadam\x2c\x20I\x20have\x20read\x20a\x20document\x20on\x20https\x3a\x2f\x2fincometaxindia\x2egov\x2ein\x2f\x20I\x20feel\x20that\x20the\x20same\x20would\x20be\x20of\x20professional\x20interest\x20to\x20you\x2e\x20Please\x20copy\x20and\x20paste\x20below\x20URL\x20in\x20the\x20Browser', r = encodeURIComponent(t), a = encodeURIComponent(
    `${n} "${e}"`
  );
  window.location.href = `mailto:?subject=${r}&body=${a}`;
}, Uv = async (e, t = !1, n) => {
  var a, i, s, c, u, p;
  const r = (a = Et(
    e,
    "selectType"
  )) == null ? void 0 : a.value;
  if (r === "reportFile") {
    const g = (s = (i = Et(
      e,
      "reportFile"
    )) == null ? void 0 : i.document) == null ? void 0 : s.contentUrl, v = g ? `${themeDisplay.getPortalURL()}${g}` : null;
    v && t ? Sl(v) : g && window.open(g, "_blank");
    return;
  }
  if (r === "circularNotifiation") {
    $d((u = (c = Et(e, "contentToAttach")) == null ? void 0 : c.structuredContentLink) == null ? void 0 : u.id, printFrameRef, t);
    return;
  }
  if (r === "linkToPage") {
    const g = (p = Et(e, "linkToPage")) == null ? void 0 : p.data;
    g && window.open(g, "_blank");
    return;
  }
  if (r === "documentContent") {
    to(
      e == null ? void 0 : e.itemURL,
      n,
      "",
      !t
    );
    return;
  }
}, Bv = (e, t, n) => {
  var c, u;
  let r = (e == null ? void 0 : e.title) ?? "";
  const a = (c = Et(e, "sectionShortDescription")) == null ? void 0 : c.data, i = (u = Et(e, "ruleShortDescription")) == null ? void 0 : u.data, s = Cl(t, e);
  if (a !== void 0 && s && (r += " " + a + " | " + s), i !== void 0 && s && (r += " " + i + " | " + s), !n)
    return { title: r, shouldShowCompare: !1 };
}, Hv = async (e, t) => {
  var g, v;
  const n = String(Cl(t, e.embedded || e || {})), r = Et(e.embedded || e || {}, "sectionCMSID"), a = /* @__PURE__ */ new Set([
    "Income-tax Act, 2025",
    "आय-कर अधिनियम, 1961",
    "Income-tax Act, 1961",
    "आय-कर अधिनियम, 2025",
    "आयकर नियम, 1962",
    "Income-tax Rules",
    "Income-tax Rules, 2026",
    "आयकर नियम, 2026"
  ]), i = n === "Income-tax Act, 1961" || n === "आय-कर अधिनियम, 1961" || n === "Income-tax Rules" || n === "आयकर नियम, 1962", s = {
    fields: i ? "childSectionTitle_i18n,childDataValidity_i18n" : "parentSectionTitle_i18n,parentDataValidity_i18n",
    restrictFields: "actions,creator,facets",
    page: 1,
    pageSize: -1,
    filter: `${i ? "parentSectionCmsId" : "childSectionCmsId"} eq '${r.data}'`
  }, c = await Ve.getObjectData("/o/c/incometaxactcompares/", s);
  let u = !1;
  if (((g = c == null ? void 0 : c.items) == null ? void 0 : g.length) > 0) {
    if (n === "Income-tax Act, 1961" || n === "आय-कर अधिनियम, 1961" || n === "Income-tax Rules" || n === "आयकर नियम, 1962")
      for (const y of c.items) {
        const E = Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? y.childSectionTitle_i18n.en_US : y.childSectionTitle_i18n.hi_IN, L = Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? y.childDataValidity_i18n.en_US == "VALID-HTML" : y.childDataValidity_i18n.hi_IN == "VALID-HTML", x = Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? y.childDataValidity_i18n.en_US == "VALID-PDF" : y.childDataValidity_i18n.hi_IN == "VALID-PDF";
        if (E && (L || x)) {
          u = !0;
          break;
        }
      }
    else if (n === "Income-tax Act, 2025" || n === "आय-कर अधिनियम, 2025" || n === "Income-tax Rules, 2026" || n === "आयकर नियम, 2026")
      for (const y of c.items) {
        const E = Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? y.parentSectionTitle_i18n.en_US : y.parentSectionTitle_i18n.hi_IN, L = Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? y.parentDataValidity_i18n.en_US == "VALID-HTML" : y.parentDataValidity_i18n.hi_IN == "VALID-HTML", x = Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? y.parentDataValidity_i18n.en_US == "VALID-PDF" : y.parentDataValidity_i18n.hi_IN == "VALID-PDF";
        if (E && (L || x)) {
          u = !0;
          break;
        }
      }
  }
  const p = a.has(n) && r.data && ((v = c == null ? void 0 : c.items) == null ? void 0 : v.length) > 0 && u;
  if (p) {
    if (n == "Income-tax Act, 2025") return { title: "Income-tax Act, 1961", shouldShowCompare: p };
    if (n == "Income-tax Act, 1961") return { title: "Income-tax Act, 2025", shouldShowCompare: p };
    if (n == "आय-कर अधिनियम, 1961") return { title: "आय-कर अधिनियम, 2025", shouldShowCompare: p };
    if (n == "आय-कर अधिनियम, 2025") return { title: "आय-कर अधिनियम, 1961", shouldShowCompare: p };
    if (n == "Income-tax Rules, 2026") return { title: "Income-tax Rules", shouldShowCompare: p };
    if (n == "आयकर नियम, 2026") return { title: "आयकर नियम, 1962", shouldShowCompare: p };
    if (n == "Income-tax Rules") return { title: "Income-tax Rules, 2026", shouldShowCompare: p };
    if (n == "आयकर नियम, 1962") return { title: "आयकर नियम, 2026", shouldShowCompare: p };
  }
}, zv = async ({
  aggregatedResponse: e = [],
  includAll: t = !1,
  subjectVocabName: n = "",
  order: r = "asc",
  siteId: a = ""
}) => {
  var p, g;
  const i = await Id(
    n,
    r,
    t,
    a
  ), s = (g = (p = e == null ? void 0 : e.aggregations) == null ? void 0 : p.aggregate_category) == null ? void 0 : g.buckets, c = new Set(s.map((v) => v.key)), u = i.filter(
    (v) => v.id !== "0" && c.has(v.id)
  );
  if (u.length > 0 && t) {
    const v = i.find(
      (y) => y.id === "0"
    );
    v && u.unshift(v);
  }
  return u;
}, _s = (e) => typeof e == "string" ? e : Array.isArray(e) ? e.map(_s).join("") : l.isValidElement(e) ? _s(e.props.children) : "", qv = (e, t) => {
  if (!e || !e.taxonomyCategoryProperties)
    return null;
  const n = e.taxonomyCategoryProperties.find(
    (r) => r.key === t
  );
  return n ? n.value : "";
}, Wv = (e, t) => e.filter((r) => {
  const a = r.taxonomyCategoryProperties || [], i = Liferay.ThemeDisplay.getLanguageId(), s = a.find((c) => c.key === `exclude_${i}`);
  if ((s == null ? void 0 : s.value) === "true")
    return !1;
  if (t) {
    const c = a.find((u) => u.key === `${t}_exclude_${i}`);
    if ((c == null ? void 0 : c.value) === "true")
      return !1;
  }
  return !0;
}), F = {
  createQueryString: Yh,
  getValuesFromJson: Et,
  highlightSearchText: Gh,
  highlightHtmlContent: Kh,
  handleJumpToPageChange: Jh,
  handleJumpToPageKeyDown: Qh,
  removeUrlAttribute: Pd,
  formatDateDashString: Xh,
  formatDateSlashString: Zh,
  formatDate: ev,
  customNoOptionsMessage: nv,
  getLastSegment: rv,
  disableSearch: av,
  createSearchBody: Ll,
  etdsPrint: $s,
  openPdfInNewTab: dv,
  fetchRelatedContentData: pv,
  fetchRelatedContents: wv,
  fetchRelatedContentCategories: fv,
  handleDocumentViewerSidebarClick: Ev,
  handleDocumentViewerSidebarOpen: Lv,
  handleCloseFootnoteClick: Cv,
  fetchAllCategoryTabs: Id,
  extractVideoID: Dv,
  queryParamCategory: Ad,
  openSelectedDocument: kv,
  getFilteredYear: Pv,
  handlePrintPdf: Sl,
  handleDocumentViewerPrint: to,
  fetchAllPickList: Sv,
  fetchAllPickListWithErc: Tv,
  extractNestedFieldValues: Od,
  fetchRelevantHyperlinks: Nv,
  fetchRelatedContentIds: Rv,
  downloadContentPdf: Md,
  fetchSelectedStructureOptions: Iv,
  convertDateWithFormat: Av,
  handlePrintViewer: $d,
  getTaggedCategory: Ov,
  handleShowContent: Mv,
  handleLogout: $v,
  formatDateToDayMonthYear: tv,
  truncateText: Fv,
  showContent: _v,
  generateStructuredContentUrlAndFetchData: jv,
  announceScreenReaderMessage: Rd,
  getTaxonomyName: Cl,
  fetchFeatureCountsFromBP: gv,
  buildOrderedFeatureList: vv,
  resolveBpAndSortByFeatureName: Nd,
  fetchFeatureItemsPagedFromBP: bv,
  kmsRedirectionNavigation: Fs,
  handleEmailAndRedirection: Vv,
  handleCommonPrintViewer: Uv,
  getActRuleDocumentViewerTitle: Bv,
  getAggregatedCategory: zv,
  extractTextFromReactElement: _s,
  getActCompareContext: Hv,
  getCategoryPropertyValue: qv,
  filterCategoriesByFeature: Wv
}, ur = themeDisplay.getScopeGroupId(), Yv = (e, t, n) => Liferay.Util.fetch(
  `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/structured-contents?page=${e}&pageSize=${t}&flatten=true&${n}`,
  {
    method: "GET",
    headers: {
      "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
    }
  }
).then((r) => r.json()), Gv = async (e, t, n, r, a, i, s) => {
  var c, u;
  try {
    let p = JSON.stringify({
      attributes: {
        "search.empty.search": !0,
        "search.experiences.blueprint.external.reference.code": "acts-aggregation-blueprint"
      }
    }), g = "";
    if (a) {
      const x = await (await Liferay.Util.fetch(
        `${Liferay.ThemeDisplay.getPortalURL()}/o/search/v1.0/search?fields=score&pageSize=1&${a}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          },
          body: p
        }
      )).json();
      (u = (c = x.aggregations) == null ? void 0 : c.acts) != null && u.buckets && (g = x.aggregations.acts.buckets.map((C) => Number(C.key)).join(","));
    }
    p = JSON.stringify({
      attributes: {
        "search.empty.search": n || !0,
        "search.experiences.blueprint.external.reference.code": r || "ALL_ACTS_BP_ERC",
        "search.experiences.isAlpha": e.toString(),
        "search.experiences.actIds": g,
        "search.experiences.langId": t || "en_US"
      }
    });
    const v = i || 1, y = s || 36;
    return await (await Liferay.Util.fetch(
      `${Liferay.ThemeDisplay.getPortalURL()}/o/search/v1.0/search?nestedFields=embedded&page=${v}&pageSize=${y}&${g ? "" : a}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: p
      }
    )).json();
  } catch (p) {
    return console.error("Error fetching data:", p), null;
  }
}, Kv = (e) => Ve.getJournalArticles(1, 1, e), Jv = (e) => Liferay.Util.fetch(
  `/o/headless-admin-taxonomy/v1.0/sites/${ur}/taxonomy-vocabularies?${F.createQueryString(
    e
  )}`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "en-US"
    }
  }
).then((t) => t.json()), Qv = async (e, t) => {
  let n = [], r = {
    fields: "externalReferenceCode,id,name",
    restrictFields: "actions,creator",
    pageSize: -1
  };
  return t && (r = {
    ...r,
    ...t
  }), n = await Liferay.Util.fetch(
    `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${e}/taxonomy-categories?${F.createQueryString(
      r
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
      }
    }
  ).then((a) => a.json()), n.items.length == 0 && console.warn("No Categories Found for vocabulary Id->", e), n;
}, _d = async (e, t, n = "") => {
  let r = "";
  if (n)
    n !== "0" && (r = `taxonomyCategoryIds/any(t:t eq ${n})`);
  else {
    const i = F.queryParamCategory("categoryId");
    Array.isArray(i) && i.some((s) => s.trim() !== "") && (r = `taxonomyCategoryIds/any(t:${i.map((c) => `t eq ${c}`).join(" and ")})`);
  }
  r && (t.filter ? t.filter += ` and ${r}` : t.filter = r), t.restrictFields = "embedded.actions,embedded.creator";
  const a = await F.fetchRelatedContentIds();
  return a.length > 0 && (e.attributes["search.experiences.entryClassPK"] = a.join(",")), Liferay.Util.fetch(
    `/o/search/v1.0/search?${F.createQueryString(t)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
      },
      body: JSON.stringify(e)
    }
  ).then((i) => i.json());
}, Xv = async (e, t) => Liferay.Util.fetch(
  `/o/search/v1.0/suggestions?${F.createQueryString(t)}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "en-US"
    },
    body: JSON.stringify(e)
  }
).then((n) => n.json()), Zv = (e) => Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/content-structures?${F.createQueryString(
    e
  )}`,
  {
    method: "GET",
    headers: {
      "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
    }
  }
).then((t) => t.json()), ey = (e, t) => Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/content-structures/${e}/structured-contents?${F.createQueryString(
    t
  )}`,
  {
    method: "GET",
    headers: {
      "X-Accept-All-Languages": !0
    }
  }
).then((n) => n.json()), ty = (e) => Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/documents`,
  {
    method: "POST",
    headers: {
      Accept: "application/json"
    },
    body: e
  }
).then((t) => t.json()), ny = (e, t) => Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/sites/${ur}/documents/by-external-reference-code/${e}`,
  {
    method: "PUT",
    headers: {
      Accept: "application/json"
    },
    body: t
  }
).then((n) => n.json()), ry = async () => {
  try {
    let e = [], t = 1, n = 1;
    do {
      const r = {
        flatten: !0,
        fields: "id,name",
        restrictFields: "actions",
        sort: "dateModified:desc",
        page: t,
        pageSize: 500
      }, i = await (await Liferay.Util.fetch(
        `/o/headless-delivery/v1.0/sites/${ur}/document-folders?${F.createQueryString(r)}`,
        { method: "GET" }
      )).json();
      e = e.concat(i.items), n = i.lastPage, t++;
    } while (t <= n);
    return e;
  } catch (e) {
    return console.error("Error fetching Folder structures:", e), [];
  }
}, ay = (e) => Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/sites/${ur}/document-folders`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(e)
  }
).then((t) => t.json()), iy = (e, t) => Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/document-folders/${e}/document-folders`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(t)
  }
).then((n) => n.json()), oy = (e, t) => Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/document-folders/${e}/documents`,
  {
    method: "POST",
    body: t
  }
).then((n) => n.json()), sy = (e) => Liferay.Util.fetch(
  `/o/c/globalconfigurations/?${F.createQueryString(e)}`,
  {
    method: "GET"
  }
).then((t) => t.json()), ly = (e) => {
  let t = {
    fields: "externalReferenceCode,id,name",
    restrictFields: "actions,creator"
  };
  return Liferay.Util.fetch(
    `/o/headless-admin-taxonomy/v1.0/taxonomy-categories/${e}?${F.createQueryString(
      t
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
      }
    }
  ).then((n) => n.json());
}, jd = async (e, t, n = "", r = "") => {
  let a = [], i = {
    fields: "externalReferenceCode,id,name",
    filter: `name eq '${e}'`,
    restrictFields: "actions,creator"
  }, s = await Liferay.Util.fetch(
    `/o/headless-admin-taxonomy/v1.0/sites/${n || ur}/taxonomy-vocabularies?${F.createQueryString(
      i
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "en-US"
      }
    }
  ).then((p) => p.json());
  if (s.items.length > 0) {
    const p = s.items[0].id;
    let g = {
      fields: "externalReferenceCode,id,name,taxonomyCategoryProperties",
      restrictFields: "actions,creator",
      pageSize: -1
    };
    t && (g = {
      ...g,
      ...t
    }), a = await Liferay.Util.fetch(
      `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${p}/taxonomy-categories?${F.createQueryString(
        g
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
        }
      }
    ).then((v) => v.json()), a.items.length == 0 && console.log("No Categories Found for vocabularyName->", e);
  }
  const c = a.items != null && a.items.length > 0 ? a.items : [];
  return F.filterCategoriesByFeature(c, r);
}, cy = (e) => Liferay.Util.fetch(
  `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/documents/${e}?restrictFields=actions%2C%20creator&flatten=true`,
  { method: "GET" }
).then((t) => t.json()), uy = async (e, t = "Year") => {
  var c, u;
  const r = await (await Liferay.Util.fetch(
    `/o/c/globalconfigurations/?${F.createQueryString(e)}`,
    {
      method: "GET"
    }
  )).json(), a = (u = (c = r == null ? void 0 : r.items) == null ? void 0 : c[0]) != null && u.exclusionYears ? r.items[0].exclusionYears.split(",").map(Number) : [];
  return console.log("Year list", a), (await jd(
    t
  )).filter((p) => !a.includes(Number(p.id))).sort((p, g) => Number(g.name) - Number(p.name));
}, dy = async (e, t) => await Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/sites/${ur}/documents/by-external-reference-code/${t}?${F.createQueryString(
    e
  )}`
).then((n) => n.json()), fy = async (e, t) => await Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/document-folders/${e}/documents?${F.createQueryString(
    t
  )}`
).then((n) => n.json()), py = (e, t) => Liferay.Util.fetch(`${e}?${F.createQueryString(t)}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
  }
}).then((n) => n.json()), my = (e, t, n = "POST") => Liferay.Util.fetch(e, {
  method: n,
  // 'POST' or 'PUT'
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId(),
    "X-CSRF-Token": Liferay.authToken
    // Important for write operations
  },
  body: JSON.stringify(t)
}).then(async (r) => {
  if (!r.ok) {
    const a = await r.json();
    throw new Error(a.message || "Failed to push data");
  }
  return r.json();
}), gy = (e, t) => (console.log("site id " + ur), Liferay.Util.fetch(`${e}/scopes/${Liferay.ThemeDisplay.getScopeGroupId()}?${F.createQueryString(t)}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
  }
}).then((n) => n.json())), hy = (e, t) => Liferay.Util.fetch(`/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${e}/list-type-entries?${F.createQueryString(t)}`, {
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
  }
}).then((n) => n.json()), vy = async (e) => {
  var r;
  let t = {
    fields: "externalReferenceCode,id,name",
    filter: `name eq '${e}'`,
    restrictFields: "actions,creator"
  }, n = await Liferay.Util.fetch(
    `/o/headless-admin-taxonomy/v1.0/sites/${ur}/taxonomy-vocabularies?${F.createQueryString(
      t
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "en-US"
      }
    }
  ).then((a) => a.json());
  if (((r = n == null ? void 0 : n.items) == null ? void 0 : r.length) < 1) {
    console.warn("No Vocabulary found with name: " + e);
    return;
  }
  return console.log("fetched Alphabtical Index Id: " + n.items[0].id), n.items[0];
}, yy = async (e) => {
  try {
    return await (await Liferay.Util.fetch(
      `/o/c/featureconfigurations/${e}/featureYear?pageSize=-1`
    )).json();
  } catch (t) {
    console.error("Error while fetching Relationship status for Feature Configuration", t);
  }
}, by = async (e) => {
  try {
    const t = F.createQueryString(e);
    return (await (await Liferay.Util.fetch(
      `/o/c/featureconfigurations?${t}`
    )).json()).items;
  } catch (t) {
    console.error("Error while fetching Relationship status for Feature Configuration", t);
  }
}, wy = async (e = {}) => {
  try {
    const t = F.createQueryString(e), n = await Liferay.Util.fetch(
      `/o/c/globalconfigurations/?${t}`
    ), r = await (n == null ? void 0 : n.json());
    return r == null ? void 0 : r.items;
  } catch (t) {
    console.error("Error while fetching Global Configuration", t);
  }
}, xy = (e, t = {}) => {
  const n = Liferay.ThemeDisplay.getScopeGroupId();
  return Liferay.Util.fetch(
    `/o/headless-delivery/v1.0/sites/${n}/structured-contents/by-key/${e}?${F.createQueryString(
      t
    )}`,
    {
      method: "GET",
      headers: {
        "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
      }
    }
  ).then((r) => {
    if (!r.ok)
      throw new Error(`Failed to fetch article with key ${e}`);
    return r.json();
  }).catch((r) => (console.error("Error while getting the journal article by key:", r), null));
}, Ey = async (e) => {
  var t, n, r;
  try {
    const i = await _d({}, {
      search: e
    }), s = (n = (t = i == null ? void 0 : i.items) == null ? void 0 : t[0]) == null ? void 0 : n.itemURL;
    if (!s)
      throw new Error(`No itemURL found for key ${e}`);
    const c = s.split("/").pop(), u = await Liferay.Util.fetch(
      `/o/headless-admin-content/v1.0/structured-contents/${c}/versions`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
        }
      }
    );
    if (!u.ok)
      throw new Error(`Version API failed for contentId ${c}`);
    return ((r = (await u.json()).items) == null ? void 0 : r[0]) || null;
  } catch (a) {
    return console.error("Error in fetchFirstVersionByWebContentKey:", a), null;
  }
}, Ly = (e) => Liferay.Util.fetch(
  `/o/headless-delivery/v1.0/content-structures/${e}`,
  {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
    }
  }
).then((t) => t.json()), Cy = async (e, t) => {
  let n = [];
  return n = await Liferay.Util.fetch(
    `/o/headless-admin-taxonomy/v1.0/taxonomy-categories/${e}/taxonomy-categories`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
      }
    }
  ).then((r) => r.json()), n.items.length == 0 && console.log("No Categories Found for vocabularyName->", vocabularyName), n.items != null && n.items.length > 0 ? n.items : [];
}, Sy = async (e, t = {}) => {
  if (!e)
    return console.error("Error: contentId is required to fetch content."), null;
  try {
    const n = await Liferay.Util.fetch(
      `/o/headless-delivery/v1.0/structured-contents/${e}?${F.createQueryString(
        t
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
        }
      }
    );
    return n.ok ? await n.json() : (console.error(`API error while fetching content by ID ${e}: ${n.status} ${n.statusText}`), null);
  } catch (n) {
    return console.error(`An error occurred while fetching content with ID ${e}:`, n), null;
  }
}, Tl = () => {
  try {
    return Liferay.OAuth2Client.FromUserAgentApplication(
      "etds-spring-boot-oauth-application-user-agent"
    );
  } catch (e) {
    console.error("OAuth client load error:", e);
  }
}, Ty = (e, t, n) => (console.log(e), Liferay.Util.fetch(
  `${e}/etds/otp/generate`,
  {
    method: "POST",
    headers: t,
    body: JSON.stringify(n)
  }
)), Dy = () => {
  try {
    return Liferay.OAuth2Client.FromUserAgentApplication(
      "etds-node-oauth-application-user-agent"
    );
  } catch (e) {
    console.error("Node OAuth client load error:", e);
  }
}, ky = () => {
  let e = Dy();
  return e != null && e.homePageURL && window.location.origin.includes("liferay-") ? e == null ? void 0 : e.homePageURL : window.location.origin;
}, Vd = () => {
  let e = Tl();
  return e != null && e.homePageURL && window.location.origin.includes("liferay-") ? e == null ? void 0 : e.homePageURL : window.location.origin;
}, Py = async (e) => {
  if (!e)
    return console.error("Missing required params: siteId or friendlyUrlPath"), null;
  const t = `/o/headless-delivery/v1.0/sites/${ur}/structured-contents`, n = {
    filter: `friendlyUrlPath eq '${e}'`,
    flatten: "true"
  };
  return Liferay.Util.fetch(
    `${t}?${new URLSearchParams(n).toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
      }
    }
  ).then((r) => {
    if (!r.ok)
      throw new Error(`API error: ${r.status} ${r.statusText}`);
    return r.json();
  }).catch((r) => (console.error("Error fetching structured content:", r), null));
}, Ny = async (e) => {
  if (!e)
    return console.error("Missing required param: contentId"), null;
  try {
    const t = await Liferay.Util.fetch(
      `/o/headless-admin-content/v1.0/structured-contents/${e}/versions`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
        }
      }
    );
    if (!t.ok)
      throw new Error(`Version API failed for contentId ${e}: ${t.statusText}`);
    return await t.json();
  } catch (t) {
    return console.error("Error fetching structured content versions:", t), null;
  }
}, Ry = async (e, t) => {
  if (!e)
    return console.error("Missing userId"), !1;
  const n = Tl();
  try {
    const r = await (n == null ? void 0 : n.fetch(
      `/etds/user/resourcepermission?userId=${e}&resourceName=${t}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    ));
    if (!r.ok)
      throw new Error("Exception while creating successful req call");
    return (await r.json()).hasPermission === !0;
  } catch (r) {
    return console.error("Exception while validating permission ::", r), !1;
  }
}, Iy = async (e) => {
  let n = F.createSearchBody(
    {
      friendly_url: e
    },
    {
      emptySearch: !0,
      erc: "ARTICLE_BY_FRIENDLY_URL_BP_ERC"
    }
  );
  const r = {
    nestedFields: "embedded",
    page: 1,
    pageSize: 1
  };
  return await Ve.getSearchResults(n, r);
}, Ay = async (e) => {
  const t = Vd();
  return await Liferay.Util.fetch(`${t}/etds/visitors/${e}`, {
    method: "GET"
  });
}, Oy = async (e, t) => {
  var s;
  if (!e) {
    console.debug("No ArticleId / Friendly URL found to fetch the content");
    return;
  }
  if (console.debug("Fetching related rules for the article data ", t), !t || !t.relatedContents) {
    let c = {
      fields: "relatedContents",
      pageSize: 1
    };
    t = await Ve.fetchContentById(e, c);
  }
  const n = ((s = t.relatedContents) == null ? void 0 : s.map((c) => String(c.id)).join(",")) || "";
  if (!n || n == "")
    return console.debug("No Related Contents are mapped for the article with id ", e), [];
  const r = {
    emptySearch: !0,
    erc: "RELEVANT_RULES_BP_ERC"
  }, a = {
    related_content_ids: n
  }, i = F.createSearchBody(a, r);
  try {
    const c = {
      nestedFields: "embedded"
    }, u = await Ve.getSearchResults(i, c);
    return (u == null ? void 0 : u.items) || [];
  } catch (c) {
    console.error("Error fetching due dates:", c);
  }
  return [];
}, Ve = {
  getJournalArticles: Yv,
  getAllActs: Gv,
  getLinkedContentData: Kv,
  getVocabularies: Jv,
  getCategoryByVocabularyId: Qv,
  getSearchResults: _d,
  getSearchSuggestionResults: Xv,
  getContentStructures: Zv,
  getContentStructureRecordsById: ey,
  postDocument: ty,
  putDocument: ny,
  getDocumentFolderBySiteId: ry,
  postDocumentFolderBySiteId: ay,
  postDocumentByParentFolder: iy,
  postDocumentByFolderId: oy,
  getExlusionYear: sy,
  getCategoryByCategoryId: ly,
  getCategoriesByVocabularyName: jd,
  fetchDocumentByDocumentId: cy,
  getExclusionYearCategories: uy,
  fetchDocumentByERC: dy,
  fetchDocumentFolderDocumentsByTitle: fy,
  getObjectData: py,
  pushObjectData: my,
  fetchPickListByERC: hy,
  getVocabularyByName: vy,
  getFeaturedRelationship: yy,
  getJournalArticleById: xy,
  getSiteObjectData: gy,
  getStructureContentVersionsBykey: Ey,
  fetchContentStructureFieldsById: Ly,
  getSubCategoriesByCategoryId: Cy,
  fetchContentById: Sy,
  getMicroServiceUserAgent: Tl,
  generateOTP: Ty,
  getFeatureConfiguration: by,
  getGlobalConfigurations: wy,
  getStructuredContentByFriendlyUrl: Py,
  getStructuredContentVersions: Ny,
  hasResourcePermission: Ry,
  getArticleByFriendlyUrl: Iy,
  getHomePageUrl: Vd,
  getNodeHomePageUrl: ky,
  addVisitorIdInResponseHeader: Ay,
  fetchRelatedRules: Oy
}, Dc = "DTAA", My = async (e, t, n, r, a, i = !1, s, c = null) => {
  const u = s || { value: "", label: 'All' };
  try {
    let p = t;
    if (!p || p.length === 0) {
      const v = { sort: "name:asc" };
      let y = await Ve.getCategoriesByVocabularyName(e, v);
      y = y.filter((E) => {
        const L = E.taxonomyCategoryProperties || [], x = Liferay.ThemeDisplay.getLanguageId(), C = L.find((T) => T.key === `exclude_${x}`);
        if ((C == null ? void 0 : C.value) === "true")
          return !1;
        if (c) {
          const T = L.find((D) => D.key === `${c}_exclude_${x}`);
          if ((T == null ? void 0 : T.value) === "true")
            return !1;
        }
        return !0;
      }), e == "Article Number" && (y = $y(y)), p = (y || []).map((E) => ({
        value: E.id,
        label: E.name,
        taxonomyCategoryProperties: E.taxonomyCategoryProperties || []
      })), i && p.unshift(u), n == null || n(p);
    }
    if (!r)
      return p;
    if (!a)
      return r(p), p;
    const g = p.filter(
      (v) => v.value === u.value || a.includes(v.value)
    );
    return r(g), g;
  } catch (p) {
    console.error("Error while filtering the drodown options:", p);
  }
}, $y = (e) => {
  const t = [], n = [];
  e.forEach((a, i) => {
    t.push(a), n.push(i);
  }), t.sort((a, i) => {
    const s = (c) => {
      var p;
      const u = (p = c.taxonomyCategoryProperties) == null ? void 0 : p.find((g) => g.key === "priority");
      return u ? parseFloat(u.value) : 0;
    };
    return s(a) - s(i);
  });
  const r = [...e];
  return n.forEach((a, i) => {
    r[a] = t[i];
  }), r;
}, Fy = async (e, t, n, r, a, i = !1, s = 1, c = -1) => {
  let p = F.createSearchBody(
    {
      country: e,
      dtaa_type: t,
      entry_year: n,
      signature_year: r,
      search_text: a || null,
      dtaa_active: !i
    },
    {
      emptySearch: !0,
      erc: "DTAA_FULL_TREATY_BP_ERC"
    }
  );
  const g = {
    nestedFields: "embedded",
    page: s,
    pageSize: c
  };
  return await Ve.getSearchResults(p, g);
}, _y = async (e, t, n, r, a, i, s, c = !1, u = 1, p = -1) => {
  let v = F.createSearchBody(
    {
      country: e,
      dtaa_type: t,
      article_number: n,
      subject: r,
      entry_year: a,
      signature_year: i,
      search_text: s || null,
      dtaa_active: !c
    },
    {
      emptySearch: !0,
      erc: "DTAA_ARTICLE_SUBJECT_BP_ERC"
    }
  );
  const y = {
    nestedFields: "embedded",
    page: u,
    pageSize: p
  };
  return await Ve.getSearchResults(v, y);
}, jy = (e, t, n, r, a, i, s) => {
  const c = {
    freeText: s,
    isParallelViewerEnabled: !0,
    parallelViewWindowCount: 3,
    entityName: Dc,
    countriesList: n == null ? void 0 : n.filter((u) => u.value !== ""),
    dtaaTypeList: r == null ? void 0 : r.filter((u) => u.value !== ""),
    articleNumbersList: a == null ? void 0 : a.filter((u) => u.value !== ""),
    subjectsList: i == null ? void 0 : i.filter((u) => u.value !== ""),
    enableParallelReading: !0
  };
  openDocumentViewer(Dc, e, t, c);
}, Vy = (e) => {
  var t, n, r, a, i, s, c, u;
  return (u = (c = (s = (i = (a = (r = (n = (t = e.aggregations) == null ? void 0 : t.entry_force_year_list) == null ? void 0 : n.childrenAggregationResultsMap) == null ? void 0 : r.filter_entry_force_year_list) == null ? void 0 : a.childrenAggregationResultsMap) == null ? void 0 : i.entry_year_values) == null ? void 0 : s.buckets) == null ? void 0 : c.sort((p, g) => g.key - p.key)) == null ? void 0 : u.map((p) => ({
    value: p.key,
    label: p.key
  }));
}, Uy = (e) => {
  var t, n, r, a, i, s, c, u;
  return (u = (c = (s = (i = (a = (r = (n = (t = e.aggregations) == null ? void 0 : t.signature_year_list) == null ? void 0 : n.childrenAggregationResultsMap) == null ? void 0 : r.filter_signature_year_list) == null ? void 0 : a.childrenAggregationResultsMap) == null ? void 0 : i.signature_year_values) == null ? void 0 : s.buckets) == null ? void 0 : c.sort((p, g) => g.key - p.key)) == null ? void 0 : u.map((p) => ({
    value: p.key,
    label: p.key
  }));
}, By = () => {
  const e = (/* @__PURE__ */ new Date()).getFullYear(), t = 1967, n = [];
  for (let r = e; r >= t; r--)
    n.push({
      value: r.toString(),
      label: r.toString()
    });
  return n;
}, Hy = (e, t, n) => {
  try {
    if (window.showLoader(), !e || e.length === 0 || !t || t.length === 0) {
      n == null || n([]);
      return;
    }
    const r = /* @__PURE__ */ new Map();
    for (const i of e) {
      const { embedded: s, itemURL: c } = i, u = s == null ? void 0 : s.taxonomyCategoryBriefs;
      if (u) {
        const p = u.map((g) => String(g.taxonomyCategoryId));
        u.forEach((g) => {
          const v = String(g.taxonomyCategoryId);
          r.has(v) || r.set(v, {
            itemURL: c,
            entryClassPK: String(s.id || s.key || ""),
            assetCategoryIds: p
          });
        });
      }
    }
    const a = t.filter((i) => r.has(i.value)).map((i) => ({ ...i, ...r.get(i.value) }));
    return n == null || n(a), a;
  } catch (r) {
    console.error("Error while filtering DTAA dropdown options:", r), n == null || n([]);
  } finally {
    window.hideLoader();
  }
  return [];
}, zy = (e, t, n) => {
  var r;
  try {
    if (!n) {
      console.warn("setFilteredList is not provided. Cannot update the list.");
      return;
    }
    if (!e || e.length === 0) {
      n([]);
      return;
    }
    const a = /* @__PURE__ */ new Map();
    for (const s of e) {
      const c = (r = F.getValuesFromJson(s, t)) == null ? void 0 : r.data;
      if (!c) continue;
      const { embedded: u, itemURL: p } = s, { id: g, key: v, taxonomyCategoryBriefs: y = [] } = u;
      if (c && !a.has(c)) {
        const E = y.map((L) => String(L.taxonomyCategoryId));
        a.set(c, {
          value: c,
          label: c,
          itemURL: p,
          entryClassPK: String(g || v || ""),
          assetCategoryIds: E
        });
      }
    }
    const i = Array.from(a.values()).sort((s, c) => c.label.localeCompare(s.label));
    n(i);
  } catch (a) {
    console.error("Error while filtering Years dropdown options:", a), n == null || n([]);
  }
}, qy = (e, t) => {
  switch (`${e}-${t}`) {
    case "dtaa-full-treaty-country":
      return 'etds-dtaa-full-treaty-no-match-found-for-country';
    case "dtaa-full-treaty-dtaa-type":
      return 'etds-dtaa-full-treaty-no-match-found-for-dtaa-type';
    case "dtaa-subject-country":
      return 'The\x20Subject\x20wise\x20Data\x20is\x20not\x20available\x20for\x20selected\x20Country';
    case "dtaa-subject-dtaa-type":
      return 'The\x20Subject\x20wise\x20Data\x20is\x20not\x20available\x20for\x20selected\x20DTAA\x20Type';
    case "dtaa-article-country":
      return 'The\x20Article\x20wise\x20Data\x20is\x20not\x20available\x20for\x20selected\x20Country';
    case "dtaa-article-dtaa-type":
      return 'The\x20Article\x20wise\x20Data\x20is\x20not\x20available\x20for\x20selected\x20DTAA\x20Type';
    default:
      return 'No\x20Match\x20Found';
  }
}, nn = {
  filterCategoryDropdownOptions: My,
  fetchFullTreaties: Fy,
  fetchArticlesAndSubjects: _y,
  initializeDTAADocumentViewer: jy,
  getSearchedEntryForceYearsList: Vy,
  getSearchedSignatureYearsList: Uy,
  getDTAAYearsList: By,
  getFilteredCategoryDropdownOptions: Hy,
  getFilteredYearsDropdownOptions: zy,
  dtaaCustomNoOptionsMessage: qy
}, Wy = ({ featureConfig: e, globalConfig: t }) => {
  const n = (a, i) => {
    const s = /* @__PURE__ */ new Date();
    if (!a && !i)
      return s;
    if (!a)
      return i ? new Date(i) : s;
    if (!i)
      return a ? new Date(a) : s;
    const c = new Date(a), u = new Date(i);
    return c > u ? c : u;
  };
  return (() => {
    var u;
    const { adminDate: a = "", lastUpdatedDate: i = "" } = e || {}, s = n(a, i);
    let c = ((u = t == null ? void 0 : t.lastUpdatedDateFormat) == null ? void 0 : u.name) || "MMMM do, yyyy";
    return Liferay.ThemeDisplay.getLanguageId() === "hi_IN" && c.includes("do") && (c = c.replace("do", "d")), eo(
      s,
      c,
      { locale: Liferay.ThemeDisplay.getLanguageId() === "hi_IN" ? El : qa }
    );
  })();
}, aD = ({ etdsConfigContext: e, boxDesign: t = !1 }) => {
  const n = Wy(e);
  return t == !0 ? /* @__PURE__ */ l.createElement("div", { className: "last-updated box-design" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-info-x20" }), /* @__PURE__ */ l.createElement("div", { className: "data" }, /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, 'Info\x20icon\x20graphic\x2c\x20', " "), /* @__PURE__ */ l.createElement("span", { className: "text mr-1" }, 'Last\x20Updated' + " : "), /* @__PURE__ */ l.createElement("span", { className: "date" }, n))) : /* @__PURE__ */ l.createElement("div", { className: "last-updated" }, /* @__PURE__ */ l.createElement("span", null, 'Last\x20Updated'), /* @__PURE__ */ l.createElement("span", { className: "mx-1" }, ":"), /* @__PURE__ */ l.createElement("span", null, n));
}, Yy = {
  emptySearch: !0,
  erc: "TAX_CALENDAR_DUE_DATE_BP_ERC"
}, Gy = {
  emptySearch: !0,
  erc: "TAX_CALENDAR_DUE_DATE_EVENT_BP_ERC"
}, Ky = () => {
  const e = /* @__PURE__ */ new Date(), t = e.getFullYear(), r = e.getMonth() + 1 >= 4 ? t + 1 : t, a = new Date(r, 2, 31), i = (s) => String(s.getDate()).padStart(2, "0") + "/" + String(s.getMonth() + 1).padStart(2, "0") + "/" + s.getFullYear();
  return `${i(e)} - ${i(a)}`;
}, Jy = async ({
  startDate: e,
  endDate: t,
  currentFYId: n,
  pageSize: r = -1,
  page: a = 1,
  setLoadTime: i,
  bpErc: s = Yy
}) => {
  const c = /* @__PURE__ */ new Date(), u = {
    due_date_from: e,
    due_date_to: t,
    ...n
  }, p = F.createSearchBody(u, s);
  try {
    const g = {
      nestedFields: "embedded",
      page: a,
      pageSize: r
    }, y = (await Ve.getSearchResults(p, g)).items.map((L) => ({
      shortDescription: F.getValuesFromJson(L, "shortDescription").data,
      description: F.getValuesFromJson(L, "description").data,
      dueDate: F.getValuesFromJson(L, "dueDate").data,
      title: L.title,
      relatedContents: L.embedded.relatedContents,
      articleData: L,
      id: L.embedded.id
    }));
    return typeof i == "function" && i(((/* @__PURE__ */ new Date()).getTime() - c.getTime()) / 1e3), y;
  } catch (g) {
    console.error("Error fetching due dates:", g);
  }
  return [];
}, kc = (e) => {
  const [t, n, r] = e.split("/");
  return `${r}${n.padStart(2, "0")}${t.padStart(2, "0")}`;
}, Qy = async () => {
  const { startDate: e, endDate: t } = (() => {
    const [n, r] = Ky().split(" - ");
    return {
      startDate: kc(n),
      endDate: kc(r)
    };
  })();
  try {
    return await Jy({
      startDate: e,
      endDate: t,
      currentFYId: "",
      pageSize: 5,
      bpErc: Gy
    });
  } catch (n) {
    console.error("Error fetching due dates:", n);
  }
  return [];
}, Xy = async (e, t) => {
  const n = {
    emptySearch: !0,
    erc: "PROMPTER_RELEVANT_DUE_DATES_BP_ERC"
  }, r = {
    related_content_ids: e
  }, a = F.createSearchBody(r, n);
  try {
    const i = {
      nestedFields: "embedded",
      pageSize: 5
    }, s = await Ve.getSearchResults(a, i);
    let c = s;
    return t && s.items && (c = s.items.filter(
      (p) => {
        var g, v;
        return (v = (g = p.embedded) == null ? void 0 : g.taxonomyCategoryBriefs) == null ? void 0 : v.some(
          (y) => y.taxonomyCategoryName == t
        );
      }
    )), c.map((p) => ({
      shortDescription: F.getValuesFromJson(p, "shortDescription").data,
      description: F.getValuesFromJson(p, "description").data,
      dueDate: F.getValuesFromJson(p, "dueDate").data,
      title: p.title,
      relatedContents: p.embedded.relatedContents,
      articleData: p,
      id: p.embedded.id
    }));
  } catch (i) {
    console.error("Error fetching due dates:", i);
  }
  return [];
}, Zy = () => {
  const e = /* @__PURE__ */ new Date(), t = e.getFullYear(), r = e.getMonth() + 1 >= 4 ? `${t}-${(t + 1).toString().slice(-2)}` : `${t - 1}-${t.toString().slice(-2)}`;
  return console.log(r), r;
}, eb = async (e, t) => {
  var a, i, s;
  if (!t) {
    console.debug("No ArticleId / Friendly URL found to fetch the content");
    return;
  }
  let n = "";
  if (e == "friendlyUrl")
    n = ((i = (a = (await Ve.getArticleByFriendlyUrl(t.toLowerCase())).items[0]) == null ? void 0 : a.embedded.relatedContents) == null ? void 0 : i.map((u) => String(u.id)).join(",")) || "";
  else {
    let c = {
      fields: "relatedContents",
      pageSize: 1
    };
    if (n = ((s = (await Ve.fetchContentById(t, c)).relatedContents) == null ? void 0 : s.map((p) => String(p.id)).join(",")) || "", !n || n == "")
      return [];
  }
  if (!n || n == "") {
    console.debug("No Related Dates are available");
    return;
  }
  return await Xy(n, Zy());
}, Ci = {
  fetchUpcomingDueDates: Qy,
  fetchRelatedDueDates: eb
};
var tb = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function no(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Ud = { exports: {} }, nb = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED", rb = nb, ab = rb;
function Bd() {
}
function Hd() {
}
Hd.resetWarningCache = Bd;
var ib = function() {
  function e(r, a, i, s, c, u) {
    if (u !== ab) {
      var p = new Error(
        "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
      );
      throw p.name = "Invariant Violation", p;
    }
  }
  e.isRequired = e;
  function t() {
    return e;
  }
  var n = {
    array: e,
    bigint: e,
    bool: e,
    func: e,
    number: e,
    object: e,
    string: e,
    symbol: e,
    any: e,
    arrayOf: t,
    element: e,
    elementType: e,
    instanceOf: t,
    node: e,
    objectOf: t,
    oneOf: t,
    oneOfType: t,
    shape: t,
    exact: t,
    checkPropTypes: Hd,
    resetWarningCache: Bd
  };
  return n.PropTypes = n, n;
};
Ud.exports = ib();
var ob = Ud.exports;
const Rt = /* @__PURE__ */ no(ob);
function Hr(e, t, n, r) {
  function a(i) {
    return i instanceof n ? i : new n(function(s) {
      s(i);
    });
  }
  return new (n || (n = Promise))(function(i, s) {
    function c(g) {
      try {
        p(r.next(g));
      } catch (v) {
        s(v);
      }
    }
    function u(g) {
      try {
        p(r.throw(g));
      } catch (v) {
        s(v);
      }
    }
    function p(g) {
      g.done ? i(g.value) : a(g.value).then(c, u);
    }
    p((r = r.apply(e, t || [])).next());
  });
}
const sb = /* @__PURE__ */ new Map([
  // https://github.com/guzzle/psr7/blob/2d9260799e713f1c475d3c5fdc3d6561ff7441b2/src/MimeType.php
  ["1km", "application/vnd.1000minds.decision-model+xml"],
  ["3dml", "text/vnd.in3d.3dml"],
  ["3ds", "image/x-3ds"],
  ["3g2", "video/3gpp2"],
  ["3gp", "video/3gp"],
  ["3gpp", "video/3gpp"],
  ["3mf", "model/3mf"],
  ["7z", "application/x-7z-compressed"],
  ["7zip", "application/x-7z-compressed"],
  ["123", "application/vnd.lotus-1-2-3"],
  ["aab", "application/x-authorware-bin"],
  ["aac", "audio/x-acc"],
  ["aam", "application/x-authorware-map"],
  ["aas", "application/x-authorware-seg"],
  ["abw", "application/x-abiword"],
  ["ac", "application/vnd.nokia.n-gage.ac+xml"],
  ["ac3", "audio/ac3"],
  ["acc", "application/vnd.americandynamics.acc"],
  ["ace", "application/x-ace-compressed"],
  ["acu", "application/vnd.acucobol"],
  ["acutc", "application/vnd.acucorp"],
  ["adp", "audio/adpcm"],
  ["aep", "application/vnd.audiograph"],
  ["afm", "application/x-font-type1"],
  ["afp", "application/vnd.ibm.modcap"],
  ["ahead", "application/vnd.ahead.space"],
  ["ai", "application/pdf"],
  ["aif", "audio/x-aiff"],
  ["aifc", "audio/x-aiff"],
  ["aiff", "audio/x-aiff"],
  ["air", "application/vnd.adobe.air-application-installer-package+zip"],
  ["ait", "application/vnd.dvb.ait"],
  ["ami", "application/vnd.amiga.ami"],
  ["amr", "audio/amr"],
  ["apk", "application/vnd.android.package-archive"],
  ["apng", "image/apng"],
  ["appcache", "text/cache-manifest"],
  ["application", "application/x-ms-application"],
  ["apr", "application/vnd.lotus-approach"],
  ["arc", "application/x-freearc"],
  ["arj", "application/x-arj"],
  ["asc", "application/pgp-signature"],
  ["asf", "video/x-ms-asf"],
  ["asm", "text/x-asm"],
  ["aso", "application/vnd.accpac.simply.aso"],
  ["asx", "video/x-ms-asf"],
  ["atc", "application/vnd.acucorp"],
  ["atom", "application/atom+xml"],
  ["atomcat", "application/atomcat+xml"],
  ["atomdeleted", "application/atomdeleted+xml"],
  ["atomsvc", "application/atomsvc+xml"],
  ["atx", "application/vnd.antix.game-component"],
  ["au", "audio/x-au"],
  ["avi", "video/x-msvideo"],
  ["avif", "image/avif"],
  ["aw", "application/applixware"],
  ["azf", "application/vnd.airzip.filesecure.azf"],
  ["azs", "application/vnd.airzip.filesecure.azs"],
  ["azv", "image/vnd.airzip.accelerator.azv"],
  ["azw", "application/vnd.amazon.ebook"],
  ["b16", "image/vnd.pco.b16"],
  ["bat", "application/x-msdownload"],
  ["bcpio", "application/x-bcpio"],
  ["bdf", "application/x-font-bdf"],
  ["bdm", "application/vnd.syncml.dm+wbxml"],
  ["bdoc", "application/x-bdoc"],
  ["bed", "application/vnd.realvnc.bed"],
  ["bh2", "application/vnd.fujitsu.oasysprs"],
  ["bin", "application/octet-stream"],
  ["blb", "application/x-blorb"],
  ["blorb", "application/x-blorb"],
  ["bmi", "application/vnd.bmi"],
  ["bmml", "application/vnd.balsamiq.bmml+xml"],
  ["bmp", "image/bmp"],
  ["book", "application/vnd.framemaker"],
  ["box", "application/vnd.previewsystems.box"],
  ["boz", "application/x-bzip2"],
  ["bpk", "application/octet-stream"],
  ["bpmn", "application/octet-stream"],
  ["bsp", "model/vnd.valve.source.compiled-map"],
  ["btif", "image/prs.btif"],
  ["buffer", "application/octet-stream"],
  ["bz", "application/x-bzip"],
  ["bz2", "application/x-bzip2"],
  ["c", "text/x-c"],
  ["c4d", "application/vnd.clonk.c4group"],
  ["c4f", "application/vnd.clonk.c4group"],
  ["c4g", "application/vnd.clonk.c4group"],
  ["c4p", "application/vnd.clonk.c4group"],
  ["c4u", "application/vnd.clonk.c4group"],
  ["c11amc", "application/vnd.cluetrust.cartomobile-config"],
  ["c11amz", "application/vnd.cluetrust.cartomobile-config-pkg"],
  ["cab", "application/vnd.ms-cab-compressed"],
  ["caf", "audio/x-caf"],
  ["cap", "application/vnd.tcpdump.pcap"],
  ["car", "application/vnd.curl.car"],
  ["cat", "application/vnd.ms-pki.seccat"],
  ["cb7", "application/x-cbr"],
  ["cba", "application/x-cbr"],
  ["cbr", "application/x-cbr"],
  ["cbt", "application/x-cbr"],
  ["cbz", "application/x-cbr"],
  ["cc", "text/x-c"],
  ["cco", "application/x-cocoa"],
  ["cct", "application/x-director"],
  ["ccxml", "application/ccxml+xml"],
  ["cdbcmsg", "application/vnd.contact.cmsg"],
  ["cda", "application/x-cdf"],
  ["cdf", "application/x-netcdf"],
  ["cdfx", "application/cdfx+xml"],
  ["cdkey", "application/vnd.mediastation.cdkey"],
  ["cdmia", "application/cdmi-capability"],
  ["cdmic", "application/cdmi-container"],
  ["cdmid", "application/cdmi-domain"],
  ["cdmio", "application/cdmi-object"],
  ["cdmiq", "application/cdmi-queue"],
  ["cdr", "application/cdr"],
  ["cdx", "chemical/x-cdx"],
  ["cdxml", "application/vnd.chemdraw+xml"],
  ["cdy", "application/vnd.cinderella"],
  ["cer", "application/pkix-cert"],
  ["cfs", "application/x-cfs-compressed"],
  ["cgm", "image/cgm"],
  ["chat", "application/x-chat"],
  ["chm", "application/vnd.ms-htmlhelp"],
  ["chrt", "application/vnd.kde.kchart"],
  ["cif", "chemical/x-cif"],
  ["cii", "application/vnd.anser-web-certificate-issue-initiation"],
  ["cil", "application/vnd.ms-artgalry"],
  ["cjs", "application/node"],
  ["cla", "application/vnd.claymore"],
  ["class", "application/octet-stream"],
  ["clkk", "application/vnd.crick.clicker.keyboard"],
  ["clkp", "application/vnd.crick.clicker.palette"],
  ["clkt", "application/vnd.crick.clicker.template"],
  ["clkw", "application/vnd.crick.clicker.wordbank"],
  ["clkx", "application/vnd.crick.clicker"],
  ["clp", "application/x-msclip"],
  ["cmc", "application/vnd.cosmocaller"],
  ["cmdf", "chemical/x-cmdf"],
  ["cml", "chemical/x-cml"],
  ["cmp", "application/vnd.yellowriver-custom-menu"],
  ["cmx", "image/x-cmx"],
  ["cod", "application/vnd.rim.cod"],
  ["coffee", "text/coffeescript"],
  ["com", "application/x-msdownload"],
  ["conf", "text/plain"],
  ["cpio", "application/x-cpio"],
  ["cpp", "text/x-c"],
  ["cpt", "application/mac-compactpro"],
  ["crd", "application/x-mscardfile"],
  ["crl", "application/pkix-crl"],
  ["crt", "application/x-x509-ca-cert"],
  ["crx", "application/x-chrome-extension"],
  ["cryptonote", "application/vnd.rig.cryptonote"],
  ["csh", "application/x-csh"],
  ["csl", "application/vnd.citationstyles.style+xml"],
  ["csml", "chemical/x-csml"],
  ["csp", "application/vnd.commonspace"],
  ["csr", "application/octet-stream"],
  ["css", "text/css"],
  ["cst", "application/x-director"],
  ["csv", "text/csv"],
  ["cu", "application/cu-seeme"],
  ["curl", "text/vnd.curl"],
  ["cww", "application/prs.cww"],
  ["cxt", "application/x-director"],
  ["cxx", "text/x-c"],
  ["dae", "model/vnd.collada+xml"],
  ["daf", "application/vnd.mobius.daf"],
  ["dart", "application/vnd.dart"],
  ["dataless", "application/vnd.fdsn.seed"],
  ["davmount", "application/davmount+xml"],
  ["dbf", "application/vnd.dbf"],
  ["dbk", "application/docbook+xml"],
  ["dcr", "application/x-director"],
  ["dcurl", "text/vnd.curl.dcurl"],
  ["dd2", "application/vnd.oma.dd2+xml"],
  ["ddd", "application/vnd.fujixerox.ddd"],
  ["ddf", "application/vnd.syncml.dmddf+xml"],
  ["dds", "image/vnd.ms-dds"],
  ["deb", "application/x-debian-package"],
  ["def", "text/plain"],
  ["deploy", "application/octet-stream"],
  ["der", "application/x-x509-ca-cert"],
  ["dfac", "application/vnd.dreamfactory"],
  ["dgc", "application/x-dgc-compressed"],
  ["dic", "text/x-c"],
  ["dir", "application/x-director"],
  ["dis", "application/vnd.mobius.dis"],
  ["disposition-notification", "message/disposition-notification"],
  ["dist", "application/octet-stream"],
  ["distz", "application/octet-stream"],
  ["djv", "image/vnd.djvu"],
  ["djvu", "image/vnd.djvu"],
  ["dll", "application/octet-stream"],
  ["dmg", "application/x-apple-diskimage"],
  ["dmn", "application/octet-stream"],
  ["dmp", "application/vnd.tcpdump.pcap"],
  ["dms", "application/octet-stream"],
  ["dna", "application/vnd.dna"],
  ["doc", "application/msword"],
  ["docm", "application/vnd.ms-word.template.macroEnabled.12"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["dot", "application/msword"],
  ["dotm", "application/vnd.ms-word.template.macroEnabled.12"],
  ["dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"],
  ["dp", "application/vnd.osgi.dp"],
  ["dpg", "application/vnd.dpgraph"],
  ["dra", "audio/vnd.dra"],
  ["drle", "image/dicom-rle"],
  ["dsc", "text/prs.lines.tag"],
  ["dssc", "application/dssc+der"],
  ["dtb", "application/x-dtbook+xml"],
  ["dtd", "application/xml-dtd"],
  ["dts", "audio/vnd.dts"],
  ["dtshd", "audio/vnd.dts.hd"],
  ["dump", "application/octet-stream"],
  ["dvb", "video/vnd.dvb.file"],
  ["dvi", "application/x-dvi"],
  ["dwd", "application/atsc-dwd+xml"],
  ["dwf", "model/vnd.dwf"],
  ["dwg", "image/vnd.dwg"],
  ["dxf", "image/vnd.dxf"],
  ["dxp", "application/vnd.spotfire.dxp"],
  ["dxr", "application/x-director"],
  ["ear", "application/java-archive"],
  ["ecelp4800", "audio/vnd.nuera.ecelp4800"],
  ["ecelp7470", "audio/vnd.nuera.ecelp7470"],
  ["ecelp9600", "audio/vnd.nuera.ecelp9600"],
  ["ecma", "application/ecmascript"],
  ["edm", "application/vnd.novadigm.edm"],
  ["edx", "application/vnd.novadigm.edx"],
  ["efif", "application/vnd.picsel"],
  ["ei6", "application/vnd.pg.osasli"],
  ["elc", "application/octet-stream"],
  ["emf", "image/emf"],
  ["eml", "message/rfc822"],
  ["emma", "application/emma+xml"],
  ["emotionml", "application/emotionml+xml"],
  ["emz", "application/x-msmetafile"],
  ["eol", "audio/vnd.digital-winds"],
  ["eot", "application/vnd.ms-fontobject"],
  ["eps", "application/postscript"],
  ["epub", "application/epub+zip"],
  ["es", "application/ecmascript"],
  ["es3", "application/vnd.eszigno3+xml"],
  ["esa", "application/vnd.osgi.subsystem"],
  ["esf", "application/vnd.epson.esf"],
  ["et3", "application/vnd.eszigno3+xml"],
  ["etx", "text/x-setext"],
  ["eva", "application/x-eva"],
  ["evy", "application/x-envoy"],
  ["exe", "application/octet-stream"],
  ["exi", "application/exi"],
  ["exp", "application/express"],
  ["exr", "image/aces"],
  ["ext", "application/vnd.novadigm.ext"],
  ["ez", "application/andrew-inset"],
  ["ez2", "application/vnd.ezpix-album"],
  ["ez3", "application/vnd.ezpix-package"],
  ["f", "text/x-fortran"],
  ["f4v", "video/mp4"],
  ["f77", "text/x-fortran"],
  ["f90", "text/x-fortran"],
  ["fbs", "image/vnd.fastbidsheet"],
  ["fcdt", "application/vnd.adobe.formscentral.fcdt"],
  ["fcs", "application/vnd.isac.fcs"],
  ["fdf", "application/vnd.fdf"],
  ["fdt", "application/fdt+xml"],
  ["fe_launch", "application/vnd.denovo.fcselayout-link"],
  ["fg5", "application/vnd.fujitsu.oasysgp"],
  ["fgd", "application/x-director"],
  ["fh", "image/x-freehand"],
  ["fh4", "image/x-freehand"],
  ["fh5", "image/x-freehand"],
  ["fh7", "image/x-freehand"],
  ["fhc", "image/x-freehand"],
  ["fig", "application/x-xfig"],
  ["fits", "image/fits"],
  ["flac", "audio/x-flac"],
  ["fli", "video/x-fli"],
  ["flo", "application/vnd.micrografx.flo"],
  ["flv", "video/x-flv"],
  ["flw", "application/vnd.kde.kivio"],
  ["flx", "text/vnd.fmi.flexstor"],
  ["fly", "text/vnd.fly"],
  ["fm", "application/vnd.framemaker"],
  ["fnc", "application/vnd.frogans.fnc"],
  ["fo", "application/vnd.software602.filler.form+xml"],
  ["for", "text/x-fortran"],
  ["fpx", "image/vnd.fpx"],
  ["frame", "application/vnd.framemaker"],
  ["fsc", "application/vnd.fsc.weblaunch"],
  ["fst", "image/vnd.fst"],
  ["ftc", "application/vnd.fluxtime.clip"],
  ["fti", "application/vnd.anser-web-funds-transfer-initiation"],
  ["fvt", "video/vnd.fvt"],
  ["fxp", "application/vnd.adobe.fxp"],
  ["fxpl", "application/vnd.adobe.fxp"],
  ["fzs", "application/vnd.fuzzysheet"],
  ["g2w", "application/vnd.geoplan"],
  ["g3", "image/g3fax"],
  ["g3w", "application/vnd.geospace"],
  ["gac", "application/vnd.groove-account"],
  ["gam", "application/x-tads"],
  ["gbr", "application/rpki-ghostbusters"],
  ["gca", "application/x-gca-compressed"],
  ["gdl", "model/vnd.gdl"],
  ["gdoc", "application/vnd.google-apps.document"],
  ["geo", "application/vnd.dynageo"],
  ["geojson", "application/geo+json"],
  ["gex", "application/vnd.geometry-explorer"],
  ["ggb", "application/vnd.geogebra.file"],
  ["ggt", "application/vnd.geogebra.tool"],
  ["ghf", "application/vnd.groove-help"],
  ["gif", "image/gif"],
  ["gim", "application/vnd.groove-identity-message"],
  ["glb", "model/gltf-binary"],
  ["gltf", "model/gltf+json"],
  ["gml", "application/gml+xml"],
  ["gmx", "application/vnd.gmx"],
  ["gnumeric", "application/x-gnumeric"],
  ["gpg", "application/gpg-keys"],
  ["gph", "application/vnd.flographit"],
  ["gpx", "application/gpx+xml"],
  ["gqf", "application/vnd.grafeq"],
  ["gqs", "application/vnd.grafeq"],
  ["gram", "application/srgs"],
  ["gramps", "application/x-gramps-xml"],
  ["gre", "application/vnd.geometry-explorer"],
  ["grv", "application/vnd.groove-injector"],
  ["grxml", "application/srgs+xml"],
  ["gsf", "application/x-font-ghostscript"],
  ["gsheet", "application/vnd.google-apps.spreadsheet"],
  ["gslides", "application/vnd.google-apps.presentation"],
  ["gtar", "application/x-gtar"],
  ["gtm", "application/vnd.groove-tool-message"],
  ["gtw", "model/vnd.gtw"],
  ["gv", "text/vnd.graphviz"],
  ["gxf", "application/gxf"],
  ["gxt", "application/vnd.geonext"],
  ["gz", "application/gzip"],
  ["gzip", "application/gzip"],
  ["h", "text/x-c"],
  ["h261", "video/h261"],
  ["h263", "video/h263"],
  ["h264", "video/h264"],
  ["hal", "application/vnd.hal+xml"],
  ["hbci", "application/vnd.hbci"],
  ["hbs", "text/x-handlebars-template"],
  ["hdd", "application/x-virtualbox-hdd"],
  ["hdf", "application/x-hdf"],
  ["heic", "image/heic"],
  ["heics", "image/heic-sequence"],
  ["heif", "image/heif"],
  ["heifs", "image/heif-sequence"],
  ["hej2", "image/hej2k"],
  ["held", "application/atsc-held+xml"],
  ["hh", "text/x-c"],
  ["hjson", "application/hjson"],
  ["hlp", "application/winhlp"],
  ["hpgl", "application/vnd.hp-hpgl"],
  ["hpid", "application/vnd.hp-hpid"],
  ["hps", "application/vnd.hp-hps"],
  ["hqx", "application/mac-binhex40"],
  ["hsj2", "image/hsj2"],
  ["htc", "text/x-component"],
  ["htke", "application/vnd.kenameaapp"],
  ["htm", "text/html"],
  ["html", "text/html"],
  ["hvd", "application/vnd.yamaha.hv-dic"],
  ["hvp", "application/vnd.yamaha.hv-voice"],
  ["hvs", "application/vnd.yamaha.hv-script"],
  ["i2g", "application/vnd.intergeo"],
  ["icc", "application/vnd.iccprofile"],
  ["ice", "x-conference/x-cooltalk"],
  ["icm", "application/vnd.iccprofile"],
  ["ico", "image/x-icon"],
  ["ics", "text/calendar"],
  ["ief", "image/ief"],
  ["ifb", "text/calendar"],
  ["ifm", "application/vnd.shana.informed.formdata"],
  ["iges", "model/iges"],
  ["igl", "application/vnd.igloader"],
  ["igm", "application/vnd.insors.igm"],
  ["igs", "model/iges"],
  ["igx", "application/vnd.micrografx.igx"],
  ["iif", "application/vnd.shana.informed.interchange"],
  ["img", "application/octet-stream"],
  ["imp", "application/vnd.accpac.simply.imp"],
  ["ims", "application/vnd.ms-ims"],
  ["in", "text/plain"],
  ["ini", "text/plain"],
  ["ink", "application/inkml+xml"],
  ["inkml", "application/inkml+xml"],
  ["install", "application/x-install-instructions"],
  ["iota", "application/vnd.astraea-software.iota"],
  ["ipfix", "application/ipfix"],
  ["ipk", "application/vnd.shana.informed.package"],
  ["irm", "application/vnd.ibm.rights-management"],
  ["irp", "application/vnd.irepository.package+xml"],
  ["iso", "application/x-iso9660-image"],
  ["itp", "application/vnd.shana.informed.formtemplate"],
  ["its", "application/its+xml"],
  ["ivp", "application/vnd.immervision-ivp"],
  ["ivu", "application/vnd.immervision-ivu"],
  ["jad", "text/vnd.sun.j2me.app-descriptor"],
  ["jade", "text/jade"],
  ["jam", "application/vnd.jam"],
  ["jar", "application/java-archive"],
  ["jardiff", "application/x-java-archive-diff"],
  ["java", "text/x-java-source"],
  ["jhc", "image/jphc"],
  ["jisp", "application/vnd.jisp"],
  ["jls", "image/jls"],
  ["jlt", "application/vnd.hp-jlyt"],
  ["jng", "image/x-jng"],
  ["jnlp", "application/x-java-jnlp-file"],
  ["joda", "application/vnd.joost.joda-archive"],
  ["jp2", "image/jp2"],
  ["jpe", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["jpf", "image/jpx"],
  ["jpg", "image/jpeg"],
  ["jpg2", "image/jp2"],
  ["jpgm", "video/jpm"],
  ["jpgv", "video/jpeg"],
  ["jph", "image/jph"],
  ["jpm", "video/jpm"],
  ["jpx", "image/jpx"],
  ["js", "application/javascript"],
  ["json", "application/json"],
  ["json5", "application/json5"],
  ["jsonld", "application/ld+json"],
  // https://jsonlines.org/
  ["jsonl", "application/jsonl"],
  ["jsonml", "application/jsonml+json"],
  ["jsx", "text/jsx"],
  ["jxr", "image/jxr"],
  ["jxra", "image/jxra"],
  ["jxrs", "image/jxrs"],
  ["jxs", "image/jxs"],
  ["jxsc", "image/jxsc"],
  ["jxsi", "image/jxsi"],
  ["jxss", "image/jxss"],
  ["kar", "audio/midi"],
  ["karbon", "application/vnd.kde.karbon"],
  ["kdb", "application/octet-stream"],
  ["kdbx", "application/x-keepass2"],
  ["key", "application/x-iwork-keynote-sffkey"],
  ["kfo", "application/vnd.kde.kformula"],
  ["kia", "application/vnd.kidspiration"],
  ["kml", "application/vnd.google-earth.kml+xml"],
  ["kmz", "application/vnd.google-earth.kmz"],
  ["kne", "application/vnd.kinar"],
  ["knp", "application/vnd.kinar"],
  ["kon", "application/vnd.kde.kontour"],
  ["kpr", "application/vnd.kde.kpresenter"],
  ["kpt", "application/vnd.kde.kpresenter"],
  ["kpxx", "application/vnd.ds-keypoint"],
  ["ksp", "application/vnd.kde.kspread"],
  ["ktr", "application/vnd.kahootz"],
  ["ktx", "image/ktx"],
  ["ktx2", "image/ktx2"],
  ["ktz", "application/vnd.kahootz"],
  ["kwd", "application/vnd.kde.kword"],
  ["kwt", "application/vnd.kde.kword"],
  ["lasxml", "application/vnd.las.las+xml"],
  ["latex", "application/x-latex"],
  ["lbd", "application/vnd.llamagraphics.life-balance.desktop"],
  ["lbe", "application/vnd.llamagraphics.life-balance.exchange+xml"],
  ["les", "application/vnd.hhe.lesson-player"],
  ["less", "text/less"],
  ["lgr", "application/lgr+xml"],
  ["lha", "application/octet-stream"],
  ["link66", "application/vnd.route66.link66+xml"],
  ["list", "text/plain"],
  ["list3820", "application/vnd.ibm.modcap"],
  ["listafp", "application/vnd.ibm.modcap"],
  ["litcoffee", "text/coffeescript"],
  ["lnk", "application/x-ms-shortcut"],
  ["log", "text/plain"],
  ["lostxml", "application/lost+xml"],
  ["lrf", "application/octet-stream"],
  ["lrm", "application/vnd.ms-lrm"],
  ["ltf", "application/vnd.frogans.ltf"],
  ["lua", "text/x-lua"],
  ["luac", "application/x-lua-bytecode"],
  ["lvp", "audio/vnd.lucent.voice"],
  ["lwp", "application/vnd.lotus-wordpro"],
  ["lzh", "application/octet-stream"],
  ["m1v", "video/mpeg"],
  ["m2a", "audio/mpeg"],
  ["m2v", "video/mpeg"],
  ["m3a", "audio/mpeg"],
  ["m3u", "text/plain"],
  ["m3u8", "application/vnd.apple.mpegurl"],
  ["m4a", "audio/x-m4a"],
  ["m4p", "application/mp4"],
  ["m4s", "video/iso.segment"],
  ["m4u", "application/vnd.mpegurl"],
  ["m4v", "video/x-m4v"],
  ["m13", "application/x-msmediaview"],
  ["m14", "application/x-msmediaview"],
  ["m21", "application/mp21"],
  ["ma", "application/mathematica"],
  ["mads", "application/mads+xml"],
  ["maei", "application/mmt-aei+xml"],
  ["mag", "application/vnd.ecowin.chart"],
  ["maker", "application/vnd.framemaker"],
  ["man", "text/troff"],
  ["manifest", "text/cache-manifest"],
  ["map", "application/json"],
  ["mar", "application/octet-stream"],
  ["markdown", "text/markdown"],
  ["mathml", "application/mathml+xml"],
  ["mb", "application/mathematica"],
  ["mbk", "application/vnd.mobius.mbk"],
  ["mbox", "application/mbox"],
  ["mc1", "application/vnd.medcalcdata"],
  ["mcd", "application/vnd.mcd"],
  ["mcurl", "text/vnd.curl.mcurl"],
  ["md", "text/markdown"],
  ["mdb", "application/x-msaccess"],
  ["mdi", "image/vnd.ms-modi"],
  ["mdx", "text/mdx"],
  ["me", "text/troff"],
  ["mesh", "model/mesh"],
  ["meta4", "application/metalink4+xml"],
  ["metalink", "application/metalink+xml"],
  ["mets", "application/mets+xml"],
  ["mfm", "application/vnd.mfmp"],
  ["mft", "application/rpki-manifest"],
  ["mgp", "application/vnd.osgeo.mapguide.package"],
  ["mgz", "application/vnd.proteus.magazine"],
  ["mid", "audio/midi"],
  ["midi", "audio/midi"],
  ["mie", "application/x-mie"],
  ["mif", "application/vnd.mif"],
  ["mime", "message/rfc822"],
  ["mj2", "video/mj2"],
  ["mjp2", "video/mj2"],
  ["mjs", "application/javascript"],
  ["mk3d", "video/x-matroska"],
  ["mka", "audio/x-matroska"],
  ["mkd", "text/x-markdown"],
  ["mks", "video/x-matroska"],
  ["mkv", "video/x-matroska"],
  ["mlp", "application/vnd.dolby.mlp"],
  ["mmd", "application/vnd.chipnuts.karaoke-mmd"],
  ["mmf", "application/vnd.smaf"],
  ["mml", "text/mathml"],
  ["mmr", "image/vnd.fujixerox.edmics-mmr"],
  ["mng", "video/x-mng"],
  ["mny", "application/x-msmoney"],
  ["mobi", "application/x-mobipocket-ebook"],
  ["mods", "application/mods+xml"],
  ["mov", "video/quicktime"],
  ["movie", "video/x-sgi-movie"],
  ["mp2", "audio/mpeg"],
  ["mp2a", "audio/mpeg"],
  ["mp3", "audio/mpeg"],
  ["mp4", "video/mp4"],
  ["mp4a", "audio/mp4"],
  ["mp4s", "application/mp4"],
  ["mp4v", "video/mp4"],
  ["mp21", "application/mp21"],
  ["mpc", "application/vnd.mophun.certificate"],
  ["mpd", "application/dash+xml"],
  ["mpe", "video/mpeg"],
  ["mpeg", "video/mpeg"],
  ["mpg", "video/mpeg"],
  ["mpg4", "video/mp4"],
  ["mpga", "audio/mpeg"],
  ["mpkg", "application/vnd.apple.installer+xml"],
  ["mpm", "application/vnd.blueice.multipass"],
  ["mpn", "application/vnd.mophun.application"],
  ["mpp", "application/vnd.ms-project"],
  ["mpt", "application/vnd.ms-project"],
  ["mpy", "application/vnd.ibm.minipay"],
  ["mqy", "application/vnd.mobius.mqy"],
  ["mrc", "application/marc"],
  ["mrcx", "application/marcxml+xml"],
  ["ms", "text/troff"],
  ["mscml", "application/mediaservercontrol+xml"],
  ["mseed", "application/vnd.fdsn.mseed"],
  ["mseq", "application/vnd.mseq"],
  ["msf", "application/vnd.epson.msf"],
  ["msg", "application/vnd.ms-outlook"],
  ["msh", "model/mesh"],
  ["msi", "application/x-msdownload"],
  ["msl", "application/vnd.mobius.msl"],
  ["msm", "application/octet-stream"],
  ["msp", "application/octet-stream"],
  ["msty", "application/vnd.muvee.style"],
  ["mtl", "model/mtl"],
  ["mts", "model/vnd.mts"],
  ["mus", "application/vnd.musician"],
  ["musd", "application/mmt-usd+xml"],
  ["musicxml", "application/vnd.recordare.musicxml+xml"],
  ["mvb", "application/x-msmediaview"],
  ["mvt", "application/vnd.mapbox-vector-tile"],
  ["mwf", "application/vnd.mfer"],
  ["mxf", "application/mxf"],
  ["mxl", "application/vnd.recordare.musicxml"],
  ["mxmf", "audio/mobile-xmf"],
  ["mxml", "application/xv+xml"],
  ["mxs", "application/vnd.triscape.mxs"],
  ["mxu", "video/vnd.mpegurl"],
  ["n-gage", "application/vnd.nokia.n-gage.symbian.install"],
  ["n3", "text/n3"],
  ["nb", "application/mathematica"],
  ["nbp", "application/vnd.wolfram.player"],
  ["nc", "application/x-netcdf"],
  ["ncx", "application/x-dtbncx+xml"],
  ["nfo", "text/x-nfo"],
  ["ngdat", "application/vnd.nokia.n-gage.data"],
  ["nitf", "application/vnd.nitf"],
  ["nlu", "application/vnd.neurolanguage.nlu"],
  ["nml", "application/vnd.enliven"],
  ["nnd", "application/vnd.noblenet-directory"],
  ["nns", "application/vnd.noblenet-sealer"],
  ["nnw", "application/vnd.noblenet-web"],
  ["npx", "image/vnd.net-fpx"],
  ["nq", "application/n-quads"],
  ["nsc", "application/x-conference"],
  ["nsf", "application/vnd.lotus-notes"],
  ["nt", "application/n-triples"],
  ["ntf", "application/vnd.nitf"],
  ["numbers", "application/x-iwork-numbers-sffnumbers"],
  ["nzb", "application/x-nzb"],
  ["oa2", "application/vnd.fujitsu.oasys2"],
  ["oa3", "application/vnd.fujitsu.oasys3"],
  ["oas", "application/vnd.fujitsu.oasys"],
  ["obd", "application/x-msbinder"],
  ["obgx", "application/vnd.openblox.game+xml"],
  ["obj", "model/obj"],
  ["oda", "application/oda"],
  ["odb", "application/vnd.oasis.opendocument.database"],
  ["odc", "application/vnd.oasis.opendocument.chart"],
  ["odf", "application/vnd.oasis.opendocument.formula"],
  ["odft", "application/vnd.oasis.opendocument.formula-template"],
  ["odg", "application/vnd.oasis.opendocument.graphics"],
  ["odi", "application/vnd.oasis.opendocument.image"],
  ["odm", "application/vnd.oasis.opendocument.text-master"],
  ["odp", "application/vnd.oasis.opendocument.presentation"],
  ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
  ["odt", "application/vnd.oasis.opendocument.text"],
  ["oga", "audio/ogg"],
  ["ogex", "model/vnd.opengex"],
  ["ogg", "audio/ogg"],
  ["ogv", "video/ogg"],
  ["ogx", "application/ogg"],
  ["omdoc", "application/omdoc+xml"],
  ["onepkg", "application/onenote"],
  ["onetmp", "application/onenote"],
  ["onetoc", "application/onenote"],
  ["onetoc2", "application/onenote"],
  ["opf", "application/oebps-package+xml"],
  ["opml", "text/x-opml"],
  ["oprc", "application/vnd.palm"],
  ["opus", "audio/ogg"],
  ["org", "text/x-org"],
  ["osf", "application/vnd.yamaha.openscoreformat"],
  ["osfpvg", "application/vnd.yamaha.openscoreformat.osfpvg+xml"],
  ["osm", "application/vnd.openstreetmap.data+xml"],
  ["otc", "application/vnd.oasis.opendocument.chart-template"],
  ["otf", "font/otf"],
  ["otg", "application/vnd.oasis.opendocument.graphics-template"],
  ["oth", "application/vnd.oasis.opendocument.text-web"],
  ["oti", "application/vnd.oasis.opendocument.image-template"],
  ["otp", "application/vnd.oasis.opendocument.presentation-template"],
  ["ots", "application/vnd.oasis.opendocument.spreadsheet-template"],
  ["ott", "application/vnd.oasis.opendocument.text-template"],
  ["ova", "application/x-virtualbox-ova"],
  ["ovf", "application/x-virtualbox-ovf"],
  ["owl", "application/rdf+xml"],
  ["oxps", "application/oxps"],
  ["oxt", "application/vnd.openofficeorg.extension"],
  ["p", "text/x-pascal"],
  ["p7a", "application/x-pkcs7-signature"],
  ["p7b", "application/x-pkcs7-certificates"],
  ["p7c", "application/pkcs7-mime"],
  ["p7m", "application/pkcs7-mime"],
  ["p7r", "application/x-pkcs7-certreqresp"],
  ["p7s", "application/pkcs7-signature"],
  ["p8", "application/pkcs8"],
  ["p10", "application/x-pkcs10"],
  ["p12", "application/x-pkcs12"],
  ["pac", "application/x-ns-proxy-autoconfig"],
  ["pages", "application/x-iwork-pages-sffpages"],
  ["pas", "text/x-pascal"],
  ["paw", "application/vnd.pawaafile"],
  ["pbd", "application/vnd.powerbuilder6"],
  ["pbm", "image/x-portable-bitmap"],
  ["pcap", "application/vnd.tcpdump.pcap"],
  ["pcf", "application/x-font-pcf"],
  ["pcl", "application/vnd.hp-pcl"],
  ["pclxl", "application/vnd.hp-pclxl"],
  ["pct", "image/x-pict"],
  ["pcurl", "application/vnd.curl.pcurl"],
  ["pcx", "image/x-pcx"],
  ["pdb", "application/x-pilot"],
  ["pde", "text/x-processing"],
  ["pdf", "application/pdf"],
  ["pem", "application/x-x509-user-cert"],
  ["pfa", "application/x-font-type1"],
  ["pfb", "application/x-font-type1"],
  ["pfm", "application/x-font-type1"],
  ["pfr", "application/font-tdpfr"],
  ["pfx", "application/x-pkcs12"],
  ["pgm", "image/x-portable-graymap"],
  ["pgn", "application/x-chess-pgn"],
  ["pgp", "application/pgp"],
  ["php", "application/x-httpd-php"],
  ["php3", "application/x-httpd-php"],
  ["php4", "application/x-httpd-php"],
  ["phps", "application/x-httpd-php-source"],
  ["phtml", "application/x-httpd-php"],
  ["pic", "image/x-pict"],
  ["pkg", "application/octet-stream"],
  ["pki", "application/pkixcmp"],
  ["pkipath", "application/pkix-pkipath"],
  ["pkpass", "application/vnd.apple.pkpass"],
  ["pl", "application/x-perl"],
  ["plb", "application/vnd.3gpp.pic-bw-large"],
  ["plc", "application/vnd.mobius.plc"],
  ["plf", "application/vnd.pocketlearn"],
  ["pls", "application/pls+xml"],
  ["pm", "application/x-perl"],
  ["pml", "application/vnd.ctc-posml"],
  ["png", "image/png"],
  ["pnm", "image/x-portable-anymap"],
  ["portpkg", "application/vnd.macports.portpkg"],
  ["pot", "application/vnd.ms-powerpoint"],
  ["potm", "application/vnd.ms-powerpoint.presentation.macroEnabled.12"],
  ["potx", "application/vnd.openxmlformats-officedocument.presentationml.template"],
  ["ppa", "application/vnd.ms-powerpoint"],
  ["ppam", "application/vnd.ms-powerpoint.addin.macroEnabled.12"],
  ["ppd", "application/vnd.cups-ppd"],
  ["ppm", "image/x-portable-pixmap"],
  ["pps", "application/vnd.ms-powerpoint"],
  ["ppsm", "application/vnd.ms-powerpoint.slideshow.macroEnabled.12"],
  ["ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow"],
  ["ppt", "application/powerpoint"],
  ["pptm", "application/vnd.ms-powerpoint.presentation.macroEnabled.12"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ["pqa", "application/vnd.palm"],
  ["prc", "application/x-pilot"],
  ["pre", "application/vnd.lotus-freelance"],
  ["prf", "application/pics-rules"],
  ["provx", "application/provenance+xml"],
  ["ps", "application/postscript"],
  ["psb", "application/vnd.3gpp.pic-bw-small"],
  ["psd", "application/x-photoshop"],
  ["psf", "application/x-font-linux-psf"],
  ["pskcxml", "application/pskc+xml"],
  ["pti", "image/prs.pti"],
  ["ptid", "application/vnd.pvi.ptid1"],
  ["pub", "application/x-mspublisher"],
  ["pvb", "application/vnd.3gpp.pic-bw-var"],
  ["pwn", "application/vnd.3m.post-it-notes"],
  ["pya", "audio/vnd.ms-playready.media.pya"],
  ["pyv", "video/vnd.ms-playready.media.pyv"],
  ["qam", "application/vnd.epson.quickanime"],
  ["qbo", "application/vnd.intu.qbo"],
  ["qfx", "application/vnd.intu.qfx"],
  ["qps", "application/vnd.publishare-delta-tree"],
  ["qt", "video/quicktime"],
  ["qwd", "application/vnd.quark.quarkxpress"],
  ["qwt", "application/vnd.quark.quarkxpress"],
  ["qxb", "application/vnd.quark.quarkxpress"],
  ["qxd", "application/vnd.quark.quarkxpress"],
  ["qxl", "application/vnd.quark.quarkxpress"],
  ["qxt", "application/vnd.quark.quarkxpress"],
  ["ra", "audio/x-realaudio"],
  ["ram", "audio/x-pn-realaudio"],
  ["raml", "application/raml+yaml"],
  ["rapd", "application/route-apd+xml"],
  ["rar", "application/x-rar"],
  ["ras", "image/x-cmu-raster"],
  ["rcprofile", "application/vnd.ipunplugged.rcprofile"],
  ["rdf", "application/rdf+xml"],
  ["rdz", "application/vnd.data-vision.rdz"],
  ["relo", "application/p2p-overlay+xml"],
  ["rep", "application/vnd.businessobjects"],
  ["res", "application/x-dtbresource+xml"],
  ["rgb", "image/x-rgb"],
  ["rif", "application/reginfo+xml"],
  ["rip", "audio/vnd.rip"],
  ["ris", "application/x-research-info-systems"],
  ["rl", "application/resource-lists+xml"],
  ["rlc", "image/vnd.fujixerox.edmics-rlc"],
  ["rld", "application/resource-lists-diff+xml"],
  ["rm", "audio/x-pn-realaudio"],
  ["rmi", "audio/midi"],
  ["rmp", "audio/x-pn-realaudio-plugin"],
  ["rms", "application/vnd.jcp.javame.midlet-rms"],
  ["rmvb", "application/vnd.rn-realmedia-vbr"],
  ["rnc", "application/relax-ng-compact-syntax"],
  ["rng", "application/xml"],
  ["roa", "application/rpki-roa"],
  ["roff", "text/troff"],
  ["rp9", "application/vnd.cloanto.rp9"],
  ["rpm", "audio/x-pn-realaudio-plugin"],
  ["rpss", "application/vnd.nokia.radio-presets"],
  ["rpst", "application/vnd.nokia.radio-preset"],
  ["rq", "application/sparql-query"],
  ["rs", "application/rls-services+xml"],
  ["rsa", "application/x-pkcs7"],
  ["rsat", "application/atsc-rsat+xml"],
  ["rsd", "application/rsd+xml"],
  ["rsheet", "application/urc-ressheet+xml"],
  ["rss", "application/rss+xml"],
  ["rtf", "text/rtf"],
  ["rtx", "text/richtext"],
  ["run", "application/x-makeself"],
  ["rusd", "application/route-usd+xml"],
  ["rv", "video/vnd.rn-realvideo"],
  ["s", "text/x-asm"],
  ["s3m", "audio/s3m"],
  ["saf", "application/vnd.yamaha.smaf-audio"],
  ["sass", "text/x-sass"],
  ["sbml", "application/sbml+xml"],
  ["sc", "application/vnd.ibm.secure-container"],
  ["scd", "application/x-msschedule"],
  ["scm", "application/vnd.lotus-screencam"],
  ["scq", "application/scvp-cv-request"],
  ["scs", "application/scvp-cv-response"],
  ["scss", "text/x-scss"],
  ["scurl", "text/vnd.curl.scurl"],
  ["sda", "application/vnd.stardivision.draw"],
  ["sdc", "application/vnd.stardivision.calc"],
  ["sdd", "application/vnd.stardivision.impress"],
  ["sdkd", "application/vnd.solent.sdkm+xml"],
  ["sdkm", "application/vnd.solent.sdkm+xml"],
  ["sdp", "application/sdp"],
  ["sdw", "application/vnd.stardivision.writer"],
  ["sea", "application/octet-stream"],
  ["see", "application/vnd.seemail"],
  ["seed", "application/vnd.fdsn.seed"],
  ["sema", "application/vnd.sema"],
  ["semd", "application/vnd.semd"],
  ["semf", "application/vnd.semf"],
  ["senmlx", "application/senml+xml"],
  ["sensmlx", "application/sensml+xml"],
  ["ser", "application/java-serialized-object"],
  ["setpay", "application/set-payment-initiation"],
  ["setreg", "application/set-registration-initiation"],
  ["sfd-hdstx", "application/vnd.hydrostatix.sof-data"],
  ["sfs", "application/vnd.spotfire.sfs"],
  ["sfv", "text/x-sfv"],
  ["sgi", "image/sgi"],
  ["sgl", "application/vnd.stardivision.writer-global"],
  ["sgm", "text/sgml"],
  ["sgml", "text/sgml"],
  ["sh", "application/x-sh"],
  ["shar", "application/x-shar"],
  ["shex", "text/shex"],
  ["shf", "application/shf+xml"],
  ["shtml", "text/html"],
  ["sid", "image/x-mrsid-image"],
  ["sieve", "application/sieve"],
  ["sig", "application/pgp-signature"],
  ["sil", "audio/silk"],
  ["silo", "model/mesh"],
  ["sis", "application/vnd.symbian.install"],
  ["sisx", "application/vnd.symbian.install"],
  ["sit", "application/x-stuffit"],
  ["sitx", "application/x-stuffitx"],
  ["siv", "application/sieve"],
  ["skd", "application/vnd.koan"],
  ["skm", "application/vnd.koan"],
  ["skp", "application/vnd.koan"],
  ["skt", "application/vnd.koan"],
  ["sldm", "application/vnd.ms-powerpoint.slide.macroenabled.12"],
  ["sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide"],
  ["slim", "text/slim"],
  ["slm", "text/slim"],
  ["sls", "application/route-s-tsid+xml"],
  ["slt", "application/vnd.epson.salt"],
  ["sm", "application/vnd.stepmania.stepchart"],
  ["smf", "application/vnd.stardivision.math"],
  ["smi", "application/smil"],
  ["smil", "application/smil"],
  ["smv", "video/x-smv"],
  ["smzip", "application/vnd.stepmania.package"],
  ["snd", "audio/basic"],
  ["snf", "application/x-font-snf"],
  ["so", "application/octet-stream"],
  ["spc", "application/x-pkcs7-certificates"],
  ["spdx", "text/spdx"],
  ["spf", "application/vnd.yamaha.smaf-phrase"],
  ["spl", "application/x-futuresplash"],
  ["spot", "text/vnd.in3d.spot"],
  ["spp", "application/scvp-vp-response"],
  ["spq", "application/scvp-vp-request"],
  ["spx", "audio/ogg"],
  ["sql", "application/x-sql"],
  ["src", "application/x-wais-source"],
  ["srt", "application/x-subrip"],
  ["sru", "application/sru+xml"],
  ["srx", "application/sparql-results+xml"],
  ["ssdl", "application/ssdl+xml"],
  ["sse", "application/vnd.kodak-descriptor"],
  ["ssf", "application/vnd.epson.ssf"],
  ["ssml", "application/ssml+xml"],
  ["sst", "application/octet-stream"],
  ["st", "application/vnd.sailingtracker.track"],
  ["stc", "application/vnd.sun.xml.calc.template"],
  ["std", "application/vnd.sun.xml.draw.template"],
  ["stf", "application/vnd.wt.stf"],
  ["sti", "application/vnd.sun.xml.impress.template"],
  ["stk", "application/hyperstudio"],
  ["stl", "model/stl"],
  ["stpx", "model/step+xml"],
  ["stpxz", "model/step-xml+zip"],
  ["stpz", "model/step+zip"],
  ["str", "application/vnd.pg.format"],
  ["stw", "application/vnd.sun.xml.writer.template"],
  ["styl", "text/stylus"],
  ["stylus", "text/stylus"],
  ["sub", "text/vnd.dvb.subtitle"],
  ["sus", "application/vnd.sus-calendar"],
  ["susp", "application/vnd.sus-calendar"],
  ["sv4cpio", "application/x-sv4cpio"],
  ["sv4crc", "application/x-sv4crc"],
  ["svc", "application/vnd.dvb.service"],
  ["svd", "application/vnd.svd"],
  ["svg", "image/svg+xml"],
  ["svgz", "image/svg+xml"],
  ["swa", "application/x-director"],
  ["swf", "application/x-shockwave-flash"],
  ["swi", "application/vnd.aristanetworks.swi"],
  ["swidtag", "application/swid+xml"],
  ["sxc", "application/vnd.sun.xml.calc"],
  ["sxd", "application/vnd.sun.xml.draw"],
  ["sxg", "application/vnd.sun.xml.writer.global"],
  ["sxi", "application/vnd.sun.xml.impress"],
  ["sxm", "application/vnd.sun.xml.math"],
  ["sxw", "application/vnd.sun.xml.writer"],
  ["t", "text/troff"],
  ["t3", "application/x-t3vm-image"],
  ["t38", "image/t38"],
  ["taglet", "application/vnd.mynfc"],
  ["tao", "application/vnd.tao.intent-module-archive"],
  ["tap", "image/vnd.tencent.tap"],
  ["tar", "application/x-tar"],
  ["tcap", "application/vnd.3gpp2.tcap"],
  ["tcl", "application/x-tcl"],
  ["td", "application/urc-targetdesc+xml"],
  ["teacher", "application/vnd.smart.teacher"],
  ["tei", "application/tei+xml"],
  ["teicorpus", "application/tei+xml"],
  ["tex", "application/x-tex"],
  ["texi", "application/x-texinfo"],
  ["texinfo", "application/x-texinfo"],
  ["text", "text/plain"],
  ["tfi", "application/thraud+xml"],
  ["tfm", "application/x-tex-tfm"],
  ["tfx", "image/tiff-fx"],
  ["tga", "image/x-tga"],
  ["tgz", "application/x-tar"],
  ["thmx", "application/vnd.ms-officetheme"],
  ["tif", "image/tiff"],
  ["tiff", "image/tiff"],
  ["tk", "application/x-tcl"],
  ["tmo", "application/vnd.tmobile-livetv"],
  ["toml", "application/toml"],
  ["torrent", "application/x-bittorrent"],
  ["tpl", "application/vnd.groove-tool-template"],
  ["tpt", "application/vnd.trid.tpt"],
  ["tr", "text/troff"],
  ["tra", "application/vnd.trueapp"],
  ["trig", "application/trig"],
  ["trm", "application/x-msterminal"],
  ["ts", "video/mp2t"],
  ["tsd", "application/timestamped-data"],
  ["tsv", "text/tab-separated-values"],
  ["ttc", "font/collection"],
  ["ttf", "font/ttf"],
  ["ttl", "text/turtle"],
  ["ttml", "application/ttml+xml"],
  ["twd", "application/vnd.simtech-mindmapper"],
  ["twds", "application/vnd.simtech-mindmapper"],
  ["txd", "application/vnd.genomatix.tuxedo"],
  ["txf", "application/vnd.mobius.txf"],
  ["txt", "text/plain"],
  ["u8dsn", "message/global-delivery-status"],
  ["u8hdr", "message/global-headers"],
  ["u8mdn", "message/global-disposition-notification"],
  ["u8msg", "message/global"],
  ["u32", "application/x-authorware-bin"],
  ["ubj", "application/ubjson"],
  ["udeb", "application/x-debian-package"],
  ["ufd", "application/vnd.ufdl"],
  ["ufdl", "application/vnd.ufdl"],
  ["ulx", "application/x-glulx"],
  ["umj", "application/vnd.umajin"],
  ["unityweb", "application/vnd.unity"],
  ["uoml", "application/vnd.uoml+xml"],
  ["uri", "text/uri-list"],
  ["uris", "text/uri-list"],
  ["urls", "text/uri-list"],
  ["usdz", "model/vnd.usdz+zip"],
  ["ustar", "application/x-ustar"],
  ["utz", "application/vnd.uiq.theme"],
  ["uu", "text/x-uuencode"],
  ["uva", "audio/vnd.dece.audio"],
  ["uvd", "application/vnd.dece.data"],
  ["uvf", "application/vnd.dece.data"],
  ["uvg", "image/vnd.dece.graphic"],
  ["uvh", "video/vnd.dece.hd"],
  ["uvi", "image/vnd.dece.graphic"],
  ["uvm", "video/vnd.dece.mobile"],
  ["uvp", "video/vnd.dece.pd"],
  ["uvs", "video/vnd.dece.sd"],
  ["uvt", "application/vnd.dece.ttml+xml"],
  ["uvu", "video/vnd.uvvu.mp4"],
  ["uvv", "video/vnd.dece.video"],
  ["uvva", "audio/vnd.dece.audio"],
  ["uvvd", "application/vnd.dece.data"],
  ["uvvf", "application/vnd.dece.data"],
  ["uvvg", "image/vnd.dece.graphic"],
  ["uvvh", "video/vnd.dece.hd"],
  ["uvvi", "image/vnd.dece.graphic"],
  ["uvvm", "video/vnd.dece.mobile"],
  ["uvvp", "video/vnd.dece.pd"],
  ["uvvs", "video/vnd.dece.sd"],
  ["uvvt", "application/vnd.dece.ttml+xml"],
  ["uvvu", "video/vnd.uvvu.mp4"],
  ["uvvv", "video/vnd.dece.video"],
  ["uvvx", "application/vnd.dece.unspecified"],
  ["uvvz", "application/vnd.dece.zip"],
  ["uvx", "application/vnd.dece.unspecified"],
  ["uvz", "application/vnd.dece.zip"],
  ["vbox", "application/x-virtualbox-vbox"],
  ["vbox-extpack", "application/x-virtualbox-vbox-extpack"],
  ["vcard", "text/vcard"],
  ["vcd", "application/x-cdlink"],
  ["vcf", "text/x-vcard"],
  ["vcg", "application/vnd.groove-vcard"],
  ["vcs", "text/x-vcalendar"],
  ["vcx", "application/vnd.vcx"],
  ["vdi", "application/x-virtualbox-vdi"],
  ["vds", "model/vnd.sap.vds"],
  ["vhd", "application/x-virtualbox-vhd"],
  ["vis", "application/vnd.visionary"],
  ["viv", "video/vnd.vivo"],
  ["vlc", "application/videolan"],
  ["vmdk", "application/x-virtualbox-vmdk"],
  ["vob", "video/x-ms-vob"],
  ["vor", "application/vnd.stardivision.writer"],
  ["vox", "application/x-authorware-bin"],
  ["vrml", "model/vrml"],
  ["vsd", "application/vnd.visio"],
  ["vsf", "application/vnd.vsf"],
  ["vss", "application/vnd.visio"],
  ["vst", "application/vnd.visio"],
  ["vsw", "application/vnd.visio"],
  ["vtf", "image/vnd.valve.source.texture"],
  ["vtt", "text/vtt"],
  ["vtu", "model/vnd.vtu"],
  ["vxml", "application/voicexml+xml"],
  ["w3d", "application/x-director"],
  ["wad", "application/x-doom"],
  ["wadl", "application/vnd.sun.wadl+xml"],
  ["war", "application/java-archive"],
  ["wasm", "application/wasm"],
  ["wav", "audio/x-wav"],
  ["wax", "audio/x-ms-wax"],
  ["wbmp", "image/vnd.wap.wbmp"],
  ["wbs", "application/vnd.criticaltools.wbs+xml"],
  ["wbxml", "application/wbxml"],
  ["wcm", "application/vnd.ms-works"],
  ["wdb", "application/vnd.ms-works"],
  ["wdp", "image/vnd.ms-photo"],
  ["weba", "audio/webm"],
  ["webapp", "application/x-web-app-manifest+json"],
  ["webm", "video/webm"],
  ["webmanifest", "application/manifest+json"],
  ["webp", "image/webp"],
  ["wg", "application/vnd.pmi.widget"],
  ["wgt", "application/widget"],
  ["wks", "application/vnd.ms-works"],
  ["wm", "video/x-ms-wm"],
  ["wma", "audio/x-ms-wma"],
  ["wmd", "application/x-ms-wmd"],
  ["wmf", "image/wmf"],
  ["wml", "text/vnd.wap.wml"],
  ["wmlc", "application/wmlc"],
  ["wmls", "text/vnd.wap.wmlscript"],
  ["wmlsc", "application/vnd.wap.wmlscriptc"],
  ["wmv", "video/x-ms-wmv"],
  ["wmx", "video/x-ms-wmx"],
  ["wmz", "application/x-msmetafile"],
  ["woff", "font/woff"],
  ["woff2", "font/woff2"],
  ["word", "application/msword"],
  ["wpd", "application/vnd.wordperfect"],
  ["wpl", "application/vnd.ms-wpl"],
  ["wps", "application/vnd.ms-works"],
  ["wqd", "application/vnd.wqd"],
  ["wri", "application/x-mswrite"],
  ["wrl", "model/vrml"],
  ["wsc", "message/vnd.wfa.wsc"],
  ["wsdl", "application/wsdl+xml"],
  ["wspolicy", "application/wspolicy+xml"],
  ["wtb", "application/vnd.webturbo"],
  ["wvx", "video/x-ms-wvx"],
  ["x3d", "model/x3d+xml"],
  ["x3db", "model/x3d+fastinfoset"],
  ["x3dbz", "model/x3d+binary"],
  ["x3dv", "model/x3d-vrml"],
  ["x3dvz", "model/x3d+vrml"],
  ["x3dz", "model/x3d+xml"],
  ["x32", "application/x-authorware-bin"],
  ["x_b", "model/vnd.parasolid.transmit.binary"],
  ["x_t", "model/vnd.parasolid.transmit.text"],
  ["xaml", "application/xaml+xml"],
  ["xap", "application/x-silverlight-app"],
  ["xar", "application/vnd.xara"],
  ["xav", "application/xcap-att+xml"],
  ["xbap", "application/x-ms-xbap"],
  ["xbd", "application/vnd.fujixerox.docuworks.binder"],
  ["xbm", "image/x-xbitmap"],
  ["xca", "application/xcap-caps+xml"],
  ["xcs", "application/calendar+xml"],
  ["xdf", "application/xcap-diff+xml"],
  ["xdm", "application/vnd.syncml.dm+xml"],
  ["xdp", "application/vnd.adobe.xdp+xml"],
  ["xdssc", "application/dssc+xml"],
  ["xdw", "application/vnd.fujixerox.docuworks"],
  ["xel", "application/xcap-el+xml"],
  ["xenc", "application/xenc+xml"],
  ["xer", "application/patch-ops-error+xml"],
  ["xfdf", "application/vnd.adobe.xfdf"],
  ["xfdl", "application/vnd.xfdl"],
  ["xht", "application/xhtml+xml"],
  ["xhtml", "application/xhtml+xml"],
  ["xhvml", "application/xv+xml"],
  ["xif", "image/vnd.xiff"],
  ["xl", "application/excel"],
  ["xla", "application/vnd.ms-excel"],
  ["xlam", "application/vnd.ms-excel.addin.macroEnabled.12"],
  ["xlc", "application/vnd.ms-excel"],
  ["xlf", "application/xliff+xml"],
  ["xlm", "application/vnd.ms-excel"],
  ["xls", "application/vnd.ms-excel"],
  ["xlsb", "application/vnd.ms-excel.sheet.binary.macroEnabled.12"],
  ["xlsm", "application/vnd.ms-excel.sheet.macroEnabled.12"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["xlt", "application/vnd.ms-excel"],
  ["xltm", "application/vnd.ms-excel.template.macroEnabled.12"],
  ["xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template"],
  ["xlw", "application/vnd.ms-excel"],
  ["xm", "audio/xm"],
  ["xml", "application/xml"],
  ["xns", "application/xcap-ns+xml"],
  ["xo", "application/vnd.olpc-sugar"],
  ["xop", "application/xop+xml"],
  ["xpi", "application/x-xpinstall"],
  ["xpl", "application/xproc+xml"],
  ["xpm", "image/x-xpixmap"],
  ["xpr", "application/vnd.is-xpr"],
  ["xps", "application/vnd.ms-xpsdocument"],
  ["xpw", "application/vnd.intercon.formnet"],
  ["xpx", "application/vnd.intercon.formnet"],
  ["xsd", "application/xml"],
  ["xsl", "application/xml"],
  ["xslt", "application/xslt+xml"],
  ["xsm", "application/vnd.syncml+xml"],
  ["xspf", "application/xspf+xml"],
  ["xul", "application/vnd.mozilla.xul+xml"],
  ["xvm", "application/xv+xml"],
  ["xvml", "application/xv+xml"],
  ["xwd", "image/x-xwindowdump"],
  ["xyz", "chemical/x-xyz"],
  ["xz", "application/x-xz"],
  ["yaml", "text/yaml"],
  ["yang", "application/yang"],
  ["yin", "application/yin+xml"],
  ["yml", "text/yaml"],
  ["ymp", "text/x-suse-ymp"],
  ["z", "application/x-compress"],
  ["z1", "application/x-zmachine"],
  ["z2", "application/x-zmachine"],
  ["z3", "application/x-zmachine"],
  ["z4", "application/x-zmachine"],
  ["z5", "application/x-zmachine"],
  ["z6", "application/x-zmachine"],
  ["z7", "application/x-zmachine"],
  ["z8", "application/x-zmachine"],
  ["zaz", "application/vnd.zzazz.deck+xml"],
  ["zip", "application/zip"],
  ["zir", "application/vnd.zul"],
  ["zirz", "application/vnd.zul"],
  ["zmm", "application/vnd.handheld-entertainment+xml"],
  ["zsh", "text/x-scriptzsh"]
]);
function sa(e, t, n) {
  const r = lb(e), { webkitRelativePath: a } = e, i = typeof t == "string" ? t : typeof a == "string" && a.length > 0 ? a : `./${e.name}`;
  return typeof r.path != "string" && Pc(r, "path", i), Pc(r, "relativePath", i), r;
}
function lb(e) {
  const { name: t } = e;
  if (t && t.lastIndexOf(".") !== -1 && !e.type) {
    const r = t.split(".").pop().toLowerCase(), a = sb.get(r);
    a && Object.defineProperty(e, "type", {
      value: a,
      writable: !1,
      configurable: !1,
      enumerable: !0
    });
  }
  return e;
}
function Pc(e, t, n) {
  Object.defineProperty(e, t, {
    value: n,
    writable: !1,
    configurable: !1,
    enumerable: !0
  });
}
const cb = [
  // Thumbnail cache files for macOS and Windows
  ".DS_Store",
  // macOs
  "Thumbs.db"
  // Windows
];
function ub(e) {
  return Hr(this, void 0, void 0, function* () {
    return Ai(e) && db(e.dataTransfer) ? gb(e.dataTransfer, e.type) : fb(e) ? pb(e) : Array.isArray(e) && e.every((t) => "getFile" in t && typeof t.getFile == "function") ? mb(e) : [];
  });
}
function db(e) {
  return Ai(e);
}
function fb(e) {
  return Ai(e) && Ai(e.target);
}
function Ai(e) {
  return typeof e == "object" && e !== null;
}
function pb(e) {
  return js(e.target.files).map((t) => sa(t));
}
function mb(e) {
  return Hr(this, void 0, void 0, function* () {
    return (yield Promise.all(e.map((n) => n.getFile()))).map((n) => sa(n));
  });
}
function gb(e, t) {
  return Hr(this, void 0, void 0, function* () {
    if (e.items) {
      const n = js(e.items).filter((a) => a.kind === "file");
      if (t !== "drop")
        return n;
      const r = yield Promise.all(n.map(hb));
      return Nc(zd(r));
    }
    return Nc(js(e.files).map((n) => sa(n)));
  });
}
function Nc(e) {
  return e.filter((t) => cb.indexOf(t.name) === -1);
}
function js(e) {
  if (e === null)
    return [];
  const t = [];
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    t.push(r);
  }
  return t;
}
function hb(e) {
  if (typeof e.webkitGetAsEntry != "function")
    return Rc(e);
  const t = e.webkitGetAsEntry();
  return t && t.isDirectory ? qd(t) : Rc(e, t);
}
function zd(e) {
  return e.reduce((t, n) => [
    ...t,
    ...Array.isArray(n) ? zd(n) : [n]
  ], []);
}
function Rc(e, t) {
  return Hr(this, void 0, void 0, function* () {
    var n;
    if (globalThis.isSecureContext && typeof e.getAsFileSystemHandle == "function") {
      const i = yield e.getAsFileSystemHandle();
      if (i === null)
        throw new Error(`${e} is not a File`);
      if (i !== void 0) {
        const s = yield i.getFile();
        return s.handle = i, sa(s);
      }
    }
    const r = e.getAsFile();
    if (!r)
      throw new Error(`${e} is not a File`);
    return sa(r, (n = t == null ? void 0 : t.fullPath) !== null && n !== void 0 ? n : void 0);
  });
}
function vb(e) {
  return Hr(this, void 0, void 0, function* () {
    return e.isDirectory ? qd(e) : yb(e);
  });
}
function qd(e) {
  const t = e.createReader();
  return new Promise((n, r) => {
    const a = [];
    function i() {
      t.readEntries((s) => Hr(this, void 0, void 0, function* () {
        if (s.length) {
          const c = Promise.all(s.map(vb));
          a.push(c), i();
        } else
          try {
            const c = yield Promise.all(a);
            n(c);
          } catch (c) {
            r(c);
          }
      }), (s) => {
        r(s);
      });
    }
    i();
  });
}
function yb(e) {
  return Hr(this, void 0, void 0, function* () {
    return new Promise((t, n) => {
      e.file((r) => {
        const a = sa(r, e.fullPath);
        t(a);
      }, (r) => {
        n(r);
      });
    });
  });
}
var Xo = function(e, t) {
  if (e && t) {
    var n = Array.isArray(t) ? t : t.split(",");
    if (n.length === 0)
      return !0;
    var r = e.name || "", a = (e.type || "").toLowerCase(), i = a.replace(/\/.*$/, "");
    return n.some(function(s) {
      var c = s.trim().toLowerCase();
      return c.charAt(0) === "." ? r.toLowerCase().endsWith(c) : c.endsWith("/*") ? i === c.replace(/\/.*$/, "") : a === c;
    });
  }
  return !0;
};
function Ic(e) {
  return xb(e) || wb(e) || Yd(e) || bb();
}
function bb() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function wb(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function xb(e) {
  if (Array.isArray(e)) return Vs(e);
}
function Ac(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Oc(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ac(Object(n), !0).forEach(function(r) {
      Wd(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ac(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Wd(e, t, n) {
  return t in e ? Object.defineProperty(e, t, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = n, e;
}
function ja(e, t) {
  return Cb(e) || Lb(e, t) || Yd(e, t) || Eb();
}
function Eb() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Yd(e, t) {
  if (e) {
    if (typeof e == "string") return Vs(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Vs(e, t);
  }
}
function Vs(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++)
    r[n] = e[n];
  return r;
}
function Lb(e, t) {
  var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
  if (n != null) {
    var r = [], a = !0, i = !1, s, c;
    try {
      for (n = n.call(e); !(a = (s = n.next()).done) && (r.push(s.value), !(t && r.length === t)); a = !0)
        ;
    } catch (u) {
      i = !0, c = u;
    } finally {
      try {
        !a && n.return != null && n.return();
      } finally {
        if (i) throw c;
      }
    }
    return r;
  }
}
function Cb(e) {
  if (Array.isArray(e)) return e;
}
var Sb = typeof Xo == "function" ? Xo : Xo.default, Tb = "file-invalid-type", Db = "file-too-large", kb = "file-too-small", Pb = "too-many-files", Nb = function() {
  var t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", n = t.split(","), r = n.length > 1 ? "one of ".concat(n.join(", ")) : n[0];
  return {
    code: Tb,
    message: "File type must be ".concat(r)
  };
}, Mc = function(t) {
  return {
    code: Db,
    message: "File is larger than ".concat(t, " ").concat(t === 1 ? "byte" : "bytes")
  };
}, $c = function(t) {
  return {
    code: kb,
    message: "File is smaller than ".concat(t, " ").concat(t === 1 ? "byte" : "bytes")
  };
}, Rb = {
  code: Pb,
  message: "Too many files"
};
function Gd(e, t) {
  var n = e.type === "application/x-moz-file" || Sb(e, t);
  return [n, n ? null : Nb(t)];
}
function Kd(e, t, n) {
  if (Mr(e.size))
    if (Mr(t) && Mr(n)) {
      if (e.size > n) return [!1, Mc(n)];
      if (e.size < t) return [!1, $c(t)];
    } else {
      if (Mr(t) && e.size < t) return [!1, $c(t)];
      if (Mr(n) && e.size > n) return [!1, Mc(n)];
    }
  return [!0, null];
}
function Mr(e) {
  return e != null;
}
function Ib(e) {
  var t = e.files, n = e.accept, r = e.minSize, a = e.maxSize, i = e.multiple, s = e.maxFiles, c = e.validator;
  return !i && t.length > 1 || i && s >= 1 && t.length > s ? !1 : t.every(function(u) {
    var p = Gd(u, n), g = ja(p, 1), v = g[0], y = Kd(u, r, a), E = ja(y, 1), L = E[0], x = c ? c(u) : null;
    return v && L && !x;
  });
}
function Oi(e) {
  return typeof e.isPropagationStopped == "function" ? e.isPropagationStopped() : typeof e.cancelBubble < "u" ? e.cancelBubble : !1;
}
function fi(e) {
  return e.dataTransfer ? Array.prototype.some.call(e.dataTransfer.types, function(t) {
    return t === "Files" || t === "application/x-moz-file";
  }) : !!e.target && !!e.target.files;
}
function Fc(e) {
  e.preventDefault();
}
function Ab(e) {
  return e.indexOf("MSIE") !== -1 || e.indexOf("Trident/") !== -1;
}
function Ob(e) {
  return e.indexOf("Edge/") !== -1;
}
function Mb() {
  var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : window.navigator.userAgent;
  return Ab(e) || Ob(e);
}
function Gn() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return function(r) {
    for (var a = arguments.length, i = new Array(a > 1 ? a - 1 : 0), s = 1; s < a; s++)
      i[s - 1] = arguments[s];
    return t.some(function(c) {
      return !Oi(r) && c && c.apply(void 0, [r].concat(i)), Oi(r);
    });
  };
}
function $b() {
  return "showOpenFilePicker" in window;
}
function Fb(e) {
  if (Mr(e)) {
    var t = Object.entries(e).filter(function(n) {
      var r = ja(n, 2), a = r[0], i = r[1], s = !0;
      return Jd(a) || (console.warn('Skipped "'.concat(a, '" because it is not a valid MIME type. Check https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types for a list of valid MIME types.')), s = !1), (!Array.isArray(i) || !i.every(Qd)) && (console.warn('Skipped "'.concat(a, '" because an invalid file extension was provided.')), s = !1), s;
    }).reduce(function(n, r) {
      var a = ja(r, 2), i = a[0], s = a[1];
      return Oc(Oc({}, n), {}, Wd({}, i, s));
    }, {});
    return [{
      // description is required due to https://crbug.com/1264708
      description: "Files",
      accept: t
    }];
  }
  return e;
}
function _b(e) {
  if (Mr(e))
    return Object.entries(e).reduce(function(t, n) {
      var r = ja(n, 2), a = r[0], i = r[1];
      return [].concat(Ic(t), [a], Ic(i));
    }, []).filter(function(t) {
      return Jd(t) || Qd(t);
    }).join(",");
}
function jb(e) {
  return e instanceof DOMException && (e.name === "AbortError" || e.code === e.ABORT_ERR);
}
function Vb(e) {
  return e instanceof DOMException && (e.name === "SecurityError" || e.code === e.SECURITY_ERR);
}
function Jd(e) {
  return e === "audio/*" || e === "video/*" || e === "image/*" || e === "text/*" || e === "application/*" || /\w+\/[-+.\w]+/g.test(e);
}
function Qd(e) {
  return /^.*\.[\w]+$/.test(e);
}
var Ub = ["children"], Bb = ["open"], Hb = ["refKey", "role", "onKeyDown", "onFocus", "onBlur", "onClick", "onDragEnter", "onDragOver", "onDragLeave", "onDrop"], zb = ["refKey", "onChange", "onClick"];
function qb(e) {
  return Gb(e) || Yb(e) || Xd(e) || Wb();
}
function Wb() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Yb(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Gb(e) {
  if (Array.isArray(e)) return Us(e);
}
function Zo(e, t) {
  return Qb(e) || Jb(e, t) || Xd(e, t) || Kb();
}
function Kb() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Xd(e, t) {
  if (e) {
    if (typeof e == "string") return Us(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Us(e, t);
  }
}
function Us(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++)
    r[n] = e[n];
  return r;
}
function Jb(e, t) {
  var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
  if (n != null) {
    var r = [], a = !0, i = !1, s, c;
    try {
      for (n = n.call(e); !(a = (s = n.next()).done) && (r.push(s.value), !(t && r.length === t)); a = !0)
        ;
    } catch (u) {
      i = !0, c = u;
    } finally {
      try {
        !a && n.return != null && n.return();
      } finally {
        if (i) throw c;
      }
    }
    return r;
  }
}
function Qb(e) {
  if (Array.isArray(e)) return e;
}
function _c(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function $t(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? _c(Object(n), !0).forEach(function(r) {
      Bs(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : _c(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Bs(e, t, n) {
  return t in e ? Object.defineProperty(e, t, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = n, e;
}
function Mi(e, t) {
  if (e == null) return {};
  var n = Xb(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (a = 0; a < i.length; a++)
      r = i[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Xb(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, i;
  for (i = 0; i < r.length; i++)
    a = r[i], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
var Dl = /* @__PURE__ */ Xi(function(e, t) {
  var n = e.children, r = Mi(e, Ub), a = ef(r), i = a.open, s = Mi(a, Bb);
  return ud(t, function() {
    return {
      open: i
    };
  }, [i]), /* @__PURE__ */ l.createElement(Ni, null, n($t($t({}, s), {}, {
    open: i
  })));
});
Dl.displayName = "Dropzone";
var Zd = {
  disabled: !1,
  getFilesFromEvent: ub,
  maxSize: 1 / 0,
  minSize: 0,
  multiple: !0,
  maxFiles: 0,
  preventDropOnDocument: !0,
  noClick: !1,
  noKeyboard: !1,
  noDrag: !1,
  noDragEventsBubbling: !1,
  validator: null,
  useFsAccessApi: !1,
  autoFocus: !1
};
Dl.defaultProps = Zd;
Dl.propTypes = {
  /**
   * Render function that exposes the dropzone state and prop getter fns
   *
   * @param {object} params
   * @param {Function} params.getRootProps Returns the props you should apply to the root drop container you render
   * @param {Function} params.getInputProps Returns the props you should apply to hidden file input you render
   * @param {Function} params.open Open the native file selection dialog
   * @param {boolean} params.isFocused Dropzone area is in focus
   * @param {boolean} params.isFileDialogActive File dialog is opened
   * @param {boolean} params.isDragActive Active drag is in progress
   * @param {boolean} params.isDragAccept Dragged files are accepted
   * @param {boolean} params.isDragReject Some dragged files are rejected
   * @param {File[]} params.acceptedFiles Accepted files
   * @param {FileRejection[]} params.fileRejections Rejected files and why they were rejected
   */
  children: Rt.func,
  /**
   * Set accepted file types.
   * Checkout https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker types option for more information.
   * Keep in mind that mime type determination is not reliable across platforms. CSV files,
   * for example, are reported as text/plain under macOS but as application/vnd.ms-excel under
   * Windows. In some cases there might not be a mime type set at all (https://github.com/react-dropzone/react-dropzone/issues/276).
   */
  accept: Rt.objectOf(Rt.arrayOf(Rt.string)),
  /**
   * Allow drag 'n' drop (or selection from the file dialog) of multiple files
   */
  multiple: Rt.bool,
  /**
   * If false, allow dropped items to take over the current browser window
   */
  preventDropOnDocument: Rt.bool,
  /**
   * If true, disables click to open the native file selection dialog
   */
  noClick: Rt.bool,
  /**
   * If true, disables SPACE/ENTER to open the native file selection dialog.
   * Note that it also stops tracking the focus state.
   */
  noKeyboard: Rt.bool,
  /**
   * If true, disables drag 'n' drop
   */
  noDrag: Rt.bool,
  /**
   * If true, stops drag event propagation to parents
   */
  noDragEventsBubbling: Rt.bool,
  /**
   * Minimum file size (in bytes)
   */
  minSize: Rt.number,
  /**
   * Maximum file size (in bytes)
   */
  maxSize: Rt.number,
  /**
   * Maximum accepted number of files
   * The default value is 0 which means there is no limitation to how many files are accepted.
   */
  maxFiles: Rt.number,
  /**
   * Enable/disable the dropzone
   */
  disabled: Rt.bool,
  /**
   * Use this to provide a custom file aggregator
   *
   * @param {(DragEvent|Event|Array<FileSystemFileHandle>)} event A drag event or input change event (if files were selected via the file dialog)
   */
  getFilesFromEvent: Rt.func,
  /**
   * Cb for when closing the file dialog with no selection
   */
  onFileDialogCancel: Rt.func,
  /**
   * Cb for when opening the file dialog
   */
  onFileDialogOpen: Rt.func,
  /**
   * Set to true to use the https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
   * to open the file picker instead of using an `<input type="file">` click event.
   */
  useFsAccessApi: Rt.bool,
  /**
   * Set to true to focus the root element on render
   */
  autoFocus: Rt.bool,
  /**
   * Cb for when the `dragenter` event occurs.
   *
   * @param {DragEvent} event
   */
  onDragEnter: Rt.func,
  /**
   * Cb for when the `dragleave` event occurs
   *
   * @param {DragEvent} event
   */
  onDragLeave: Rt.func,
  /**
   * Cb for when the `dragover` event occurs
   *
   * @param {DragEvent} event
   */
  onDragOver: Rt.func,
  /**
   * Cb for when the `drop` event occurs.
   * Note that this callback is invoked after the `getFilesFromEvent` callback is done.
   *
   * Files are accepted or rejected based on the `accept`, `multiple`, `minSize` and `maxSize` props.
   * `accept` must be a valid [MIME type](http://www.iana.org/assignments/media-types/media-types.xhtml) according to [input element specification](https://www.w3.org/wiki/HTML/Elements/input/file) or a valid file extension.
   * If `multiple` is set to false and additional files are dropped,
   * all files besides the first will be rejected.
   * Any file which does not have a size in the [`minSize`, `maxSize`] range, will be rejected as well.
   *
   * Note that the `onDrop` callback will always be invoked regardless if the dropped files were accepted or rejected.
   * If you'd like to react to a specific scenario, use the `onDropAccepted`/`onDropRejected` props.
   *
   * `onDrop` will provide you with an array of [File](https://developer.mozilla.org/en-US/docs/Web/API/File) objects which you can then process and send to a server.
   * For example, with [SuperAgent](https://github.com/visionmedia/superagent) as a http/ajax library:
   *
   * ```js
   * function onDrop(acceptedFiles) {
   *   const req = request.post('/upload')
   *   acceptedFiles.forEach(file => {
   *     req.attach(file.name, file)
   *   })
   *   req.end(callback)
   * }
   * ```
   *
   * @param {File[]} acceptedFiles
   * @param {FileRejection[]} fileRejections
   * @param {(DragEvent|Event)} event A drag event or input change event (if files were selected via the file dialog)
   */
  onDrop: Rt.func,
  /**
   * Cb for when the `drop` event occurs.
   * Note that if no files are accepted, this callback is not invoked.
   *
   * @param {File[]} files
   * @param {(DragEvent|Event)} event
   */
  onDropAccepted: Rt.func,
  /**
   * Cb for when the `drop` event occurs.
   * Note that if no files are rejected, this callback is not invoked.
   *
   * @param {FileRejection[]} fileRejections
   * @param {(DragEvent|Event)} event
   */
  onDropRejected: Rt.func,
  /**
   * Cb for when there's some error from any of the promises.
   *
   * @param {Error} error
   */
  onError: Rt.func,
  /**
   * Custom validation function. It must return null if there's no errors.
   * @param {File} file
   * @returns {FileError|FileError[]|null}
   */
  validator: Rt.func
};
var Hs = {
  isFocused: !1,
  isFileDialogActive: !1,
  isDragActive: !1,
  isDragAccept: !1,
  isDragReject: !1,
  acceptedFiles: [],
  fileRejections: []
};
function ef() {
  var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = $t($t({}, Zd), e), n = t.accept, r = t.disabled, a = t.getFilesFromEvent, i = t.maxSize, s = t.minSize, c = t.multiple, u = t.maxFiles, p = t.onDragEnter, g = t.onDragLeave, v = t.onDragOver, y = t.onDrop, E = t.onDropAccepted, L = t.onDropRejected, x = t.onFileDialogCancel, C = t.onFileDialogOpen, T = t.useFsAccessApi, D = t.autoFocus, k = t.preventDropOnDocument, N = t.noClick, R = t.noKeyboard, A = t.noDrag, f = t.noDragEventsBubbling, _ = t.onError, O = t.validator, J = rn(function() {
    return _b(n);
  }, [n]), ee = rn(function() {
    return Fb(n);
  }, [n]), ge = rn(function() {
    return typeof C == "function" ? C : jc;
  }, [C]), ie = rn(function() {
    return typeof x == "function" ? x : jc;
  }, [x]), fe = _e(null), be = _e(null), $e = cd(Zb, Hs), Se = Zo($e, 2), xe = Se[0], Te = Se[1], We = xe.isFocused, Oe = xe.isFileDialogActive, Ne = _e(typeof window < "u" && window.isSecureContext && T && $b()), Me = function() {
    !Ne.current && Oe && setTimeout(function() {
      if (be.current) {
        var G = be.current.files;
        G.length || (Te({
          type: "closeDialog"
        }), ie());
      }
    }, 300);
  };
  ye(function() {
    return window.addEventListener("focus", Me, !1), function() {
      window.removeEventListener("focus", Me, !1);
    };
  }, [be, Oe, ie, Ne]);
  var Ze = _e([]), at = function(G) {
    fe.current && fe.current.contains(G.target) || (G.preventDefault(), Ze.current = []);
  };
  ye(function() {
    return k && (document.addEventListener("dragover", Fc, !1), document.addEventListener("drop", at, !1)), function() {
      k && (document.removeEventListener("dragover", Fc), document.removeEventListener("drop", at));
    };
  }, [fe, k]), ye(function() {
    return !r && D && fe.current && fe.current.focus(), function() {
    };
  }, [fe, D, r]);
  var He = vt(function(se) {
    _ ? _(se) : console.error(se);
  }, [_]), nt = vt(function(se) {
    se.preventDefault(), se.persist(), ue(se), Ze.current = [].concat(qb(Ze.current), [se.target]), fi(se) && Promise.resolve(a(se)).then(function(G) {
      if (!(Oi(se) && !f)) {
        var Re = G.length, bt = Re > 0 && Ib({
          files: G,
          accept: J,
          minSize: s,
          maxSize: i,
          multiple: c,
          maxFiles: u,
          validator: O
        }), St = Re > 0 && !bt;
        Te({
          isDragAccept: bt,
          isDragReject: St,
          isDragActive: !0,
          type: "setDraggedFiles"
        }), p && p(se);
      }
    }).catch(function(G) {
      return He(G);
    });
  }, [a, p, He, f, J, s, i, c, u, O]), yt = vt(function(se) {
    se.preventDefault(), se.persist(), ue(se);
    var G = fi(se);
    if (G && se.dataTransfer)
      try {
        se.dataTransfer.dropEffect = "copy";
      } catch {
      }
    return G && v && v(se), !1;
  }, [v, f]), Ct = vt(function(se) {
    se.preventDefault(), se.persist(), ue(se);
    var G = Ze.current.filter(function(bt) {
      return fe.current && fe.current.contains(bt);
    }), Re = G.indexOf(se.target);
    Re !== -1 && G.splice(Re, 1), Ze.current = G, !(G.length > 0) && (Te({
      type: "setDraggedFiles",
      isDragActive: !1,
      isDragAccept: !1,
      isDragReject: !1
    }), fi(se) && g && g(se));
  }, [fe, g, f]), rt = vt(function(se, G) {
    var Re = [], bt = [];
    se.forEach(function(St) {
      var an = Gd(St, J), ct = Zo(an, 2), yn = ct[0], un = ct[1], Ot = Kd(St, s, i), Ht = Zo(Ot, 2), dn = Ht[0], Dn = Ht[1], Qt = O ? O(St) : null;
      if (yn && dn && !Qt)
        Re.push(St);
      else {
        var kn = [un, Dn];
        Qt && (kn = kn.concat(Qt)), bt.push({
          file: St,
          errors: kn.filter(function(Rn) {
            return Rn;
          })
        });
      }
    }), (!c && Re.length > 1 || c && u >= 1 && Re.length > u) && (Re.forEach(function(St) {
      bt.push({
        file: St,
        errors: [Rb]
      });
    }), Re.splice(0)), Te({
      acceptedFiles: Re,
      fileRejections: bt,
      isDragReject: bt.length > 0,
      type: "setFiles"
    }), y && y(Re, bt, G), bt.length > 0 && L && L(bt, G), Re.length > 0 && E && E(Re, G);
  }, [Te, c, J, s, i, u, y, E, L, O]), mt = vt(function(se) {
    se.preventDefault(), se.persist(), ue(se), Ze.current = [], fi(se) && Promise.resolve(a(se)).then(function(G) {
      Oi(se) && !f || rt(G, se);
    }).catch(function(G) {
      return He(G);
    }), Te({
      type: "reset"
    });
  }, [a, rt, He, f]), dt = vt(function() {
    if (Ne.current) {
      Te({
        type: "openDialog"
      }), ge();
      var se = {
        multiple: c,
        types: ee
      };
      window.showOpenFilePicker(se).then(function(G) {
        return a(G);
      }).then(function(G) {
        rt(G, null), Te({
          type: "closeDialog"
        });
      }).catch(function(G) {
        jb(G) ? (ie(G), Te({
          type: "closeDialog"
        })) : Vb(G) ? (Ne.current = !1, be.current ? (be.current.value = null, be.current.click()) : He(new Error("Cannot open the file picker because the https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API is not supported and no <input> was provided."))) : He(G);
      });
      return;
    }
    be.current && (Te({
      type: "openDialog"
    }), ge(), be.current.value = null, be.current.click());
  }, [Te, ge, ie, T, rt, He, ee, c]), Ie = vt(function(se) {
    !fe.current || !fe.current.isEqualNode(se.target) || (se.key === " " || se.key === "Enter" || se.keyCode === 32 || se.keyCode === 13) && (se.preventDefault(), dt());
  }, [fe, dt]), Ue = vt(function() {
    Te({
      type: "focus"
    });
  }, []), Xe = vt(function() {
    Te({
      type: "blur"
    });
  }, []), ae = vt(function() {
    N || (Mb() ? setTimeout(dt, 0) : dt());
  }, [N, dt]), oe = function(G) {
    return r ? null : G;
  }, we = function(G) {
    return R ? null : oe(G);
  }, De = function(G) {
    return A ? null : oe(G);
  }, ue = function(G) {
    f && G.stopPropagation();
  }, ne = rn(function() {
    return function() {
      var se = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, G = se.refKey, Re = G === void 0 ? "ref" : G, bt = se.role, St = se.onKeyDown, an = se.onFocus, ct = se.onBlur, yn = se.onClick, un = se.onDragEnter, Ot = se.onDragOver, Ht = se.onDragLeave, dn = se.onDrop, Dn = Mi(se, Hb);
      return $t($t(Bs({
        onKeyDown: we(Gn(St, Ie)),
        onFocus: we(Gn(an, Ue)),
        onBlur: we(Gn(ct, Xe)),
        onClick: oe(Gn(yn, ae)),
        onDragEnter: De(Gn(un, nt)),
        onDragOver: De(Gn(Ot, yt)),
        onDragLeave: De(Gn(Ht, Ct)),
        onDrop: De(Gn(dn, mt)),
        role: typeof bt == "string" && bt !== "" ? bt : "presentation"
      }, Re, fe), !r && !R ? {
        tabIndex: 0
      } : {}), Dn);
    };
  }, [fe, Ie, Ue, Xe, ae, nt, yt, Ct, mt, R, A, r]), he = vt(function(se) {
    se.stopPropagation();
  }, []), et = rn(function() {
    return function() {
      var se = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, G = se.refKey, Re = G === void 0 ? "ref" : G, bt = se.onChange, St = se.onClick, an = Mi(se, zb), ct = Bs({
        accept: J,
        multiple: c,
        type: "file",
        style: {
          border: 0,
          clip: "rect(0, 0, 0, 0)",
          clipPath: "inset(50%)",
          height: "1px",
          margin: "0 -1px -1px 0",
          overflow: "hidden",
          padding: 0,
          position: "absolute",
          width: "1px",
          whiteSpace: "nowrap"
        },
        onChange: oe(Gn(bt, mt)),
        onClick: oe(Gn(St, he)),
        tabIndex: -1
      }, Re, be);
      return $t($t({}, ct), an);
    };
  }, [be, n, c, mt, r]);
  return $t($t({}, xe), {}, {
    isFocused: We && !r,
    getRootProps: ne,
    getInputProps: et,
    rootRef: fe,
    inputRef: be,
    open: oe(dt)
  });
}
function Zb(e, t) {
  switch (t.type) {
    case "focus":
      return $t($t({}, e), {}, {
        isFocused: !0
      });
    case "blur":
      return $t($t({}, e), {}, {
        isFocused: !1
      });
    case "openDialog":
      return $t($t({}, Hs), {}, {
        isFileDialogActive: !0
      });
    case "closeDialog":
      return $t($t({}, e), {}, {
        isFileDialogActive: !1
      });
    case "setDraggedFiles":
      return $t($t({}, e), {}, {
        isDragActive: t.isDragActive,
        isDragAccept: t.isDragAccept,
        isDragReject: t.isDragReject
      });
    case "setFiles":
      return $t($t({}, e), {}, {
        acceptedFiles: t.acceptedFiles,
        fileRejections: t.fileRejections,
        isDragReject: t.isDragReject
      });
    case "reset":
      return $t({}, Hs);
    default:
      return e;
  }
}
function jc() {
}
function sr({
  title: e,
  iconName: t = "",
  isAccordion: n = !1,
  onClick: r = null,
  children: a,
  accordionIcon: i = "etds-accordion-icon",
  isAccordionOpen: s = !1,
  isPopup: c = !1,
  handleDefOpen: u,
  defOpen: p,
  isCustomFocusLock: g = !0,
  isLockFocus: v = !0,
  className: y = ""
}) {
  const [E, L] = V(s), x = _e(null), C = _e(null), T = _e(null), D = () => {
    if (n) {
      const R = !(p ?? E);
      L(R);
      try {
        u == null || u(R);
      } catch (A) {
        console.warn(A);
      }
      c && R && requestAnimationFrame(() => {
        const A = C.current;
        if (!A) return;
        const f = A.getBoundingClientRect(), _ = window.innerHeight;
        A.classList.remove("position-top", "position-bottom"), f.bottom > _ ? A.classList.add("position-top") : A.classList.add("position-bottom");
      }), F.handleDocumentViewerSidebarOpen();
    } else r && r();
  }, k = (N) => {
    if (x.current && !x.current.contains(N.target)) {
      L(!1);
      try {
        u == null || u(!1);
      } catch (A) {
        console.warn(A);
      }
    }
  };
  return ye(() => {
    L(s);
  }, [s]), ye(() => (c && E && document.addEventListener("click", k), () => {
    document.removeEventListener("click", k);
  }), [E, c]), ye(() => {
    if (!c || !E) return;
    const N = () => {
      setTimeout(() => {
        const R = document.activeElement;
        if (C.current && !C.current.contains(R) && x.current && !x.current.contains(R)) {
          L(!1);
          try {
            u == null || u(!1);
          } catch {
          }
        }
      }, 0);
    };
    return document.addEventListener("focusin", N), () => {
      document.removeEventListener("focusin", N);
    };
  }, [E]), /* @__PURE__ */ l.createElement("div", { className: `additional-action ${y} open-${p ?? E}`, ref: x }, /* @__PURE__ */ l.createElement("button", { className: `title-wrap open-${p ?? E}`, role: !0, "aria-haspopup": "true", "aria-expanded": p ?? E, "aria-controls": "accordion-content", onClick: D, "aria-label": `${e}, ${'Graphic'}`, "data-tooltip-align": "top", title: e, ref: T }, /* @__PURE__ */ l.createElement("div", { className: "title text-truncate" }, t != "" && /* @__PURE__ */ l.createElement(re, { symbol: t }), /* @__PURE__ */ l.createElement("span", { className: "title-text text-truncate", title: e }, e)), n && /* @__PURE__ */ l.createElement(re, { symbol: i, className: "open-close-content" })), n && (p ?? E) && /* @__PURE__ */ l.createElement(
    "div",
    {
      id: "accordion-content",
      className: `${c ? "content-popup" : "content"}`,
      tabIndex: "-1",
      ref: C,
      onKeyDownCapture: (N) => {
        var R;
        N.key === "Escape" && (N.stopPropagation(), L(!1), u == null || u(!1), (R = T.current) == null || R.focus());
      }
    },
    v ? /* @__PURE__ */ l.createElement(Ji, { active: g && E }, a) : a
  ));
}
function Sr(e) {
  "@babel/helpers - typeof";
  return Sr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Sr(e);
}
function ew(e, t) {
  if (Sr(e) != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (Sr(r) != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function tf(e) {
  var t = ew(e, "string");
  return Sr(t) == "symbol" ? t : t + "";
}
function Mn(e, t, n) {
  return (t = tf(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Vc(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function qe(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Vc(Object(n), !0).forEach(function(r) {
      Mn(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Vc(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function tw(e) {
  if (Array.isArray(e)) return e;
}
function nw(e, t) {
  var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
  if (n != null) {
    var r, a, i, s, c = [], u = !0, p = !1;
    try {
      if (i = (n = n.call(e)).next, t === 0) {
        if (Object(n) !== n) return;
        u = !1;
      } else for (; !(u = (r = i.call(n)).done) && (c.push(r.value), c.length !== t); u = !0) ;
    } catch (g) {
      p = !0, a = g;
    } finally {
      try {
        if (!u && n.return != null && (s = n.return(), Object(s) !== s)) return;
      } finally {
        if (p) throw a;
      }
    }
    return c;
  }
}
function zs(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function nf(e, t) {
  if (e) {
    if (typeof e == "string") return zs(e, t);
    var n = {}.toString.call(e).slice(8, -1);
    return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? zs(e, t) : void 0;
  }
}
function rw() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Vn(e, t) {
  return tw(e) || nw(e, t) || nf(e, t) || rw();
}
function vn(e, t) {
  if (e == null) return {};
  var n = {};
  for (var r in e) if ({}.hasOwnProperty.call(e, r)) {
    if (t.indexOf(r) !== -1) continue;
    n[r] = e[r];
  }
  return n;
}
function Jt(e, t) {
  if (e == null) return {};
  var n, r, a = vn(e, t);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(e);
    for (r = 0; r < i.length; r++) n = i[r], t.indexOf(n) === -1 && {}.propertyIsEnumerable.call(e, n) && (a[n] = e[n]);
  }
  return a;
}
var aw = ["defaultInputValue", "defaultMenuIsOpen", "defaultValue", "inputValue", "menuIsOpen", "onChange", "onInputChange", "onMenuClose", "onMenuOpen", "value"];
function iw(e) {
  var t = e.defaultInputValue, n = t === void 0 ? "" : t, r = e.defaultMenuIsOpen, a = r === void 0 ? !1 : r, i = e.defaultValue, s = i === void 0 ? null : i, c = e.inputValue, u = e.menuIsOpen, p = e.onChange, g = e.onInputChange, v = e.onMenuClose, y = e.onMenuOpen, E = e.value, L = Jt(e, aw), x = V(c !== void 0 ? c : n), C = Vn(x, 2), T = C[0], D = C[1], k = V(u !== void 0 ? u : a), N = Vn(k, 2), R = N[0], A = N[1], f = V(E !== void 0 ? E : s), _ = Vn(f, 2), O = _[0], J = _[1], ee = vt(function(xe, Te) {
    typeof p == "function" && p(xe, Te), J(xe);
  }, [p]), ge = vt(function(xe, Te) {
    var We;
    typeof g == "function" && (We = g(xe, Te)), D(We !== void 0 ? We : xe);
  }, [g]), ie = vt(function() {
    typeof y == "function" && y(), A(!0);
  }, [y]), fe = vt(function() {
    typeof v == "function" && v(), A(!1);
  }, [v]), be = c !== void 0 ? c : T, $e = u !== void 0 ? u : R, Se = E !== void 0 ? E : O;
  return qe(qe({}, L), {}, {
    inputValue: be,
    menuIsOpen: $e,
    onChange: ee,
    onInputChange: ge,
    onMenuClose: fe,
    onMenuOpen: ie,
    value: Se
  });
}
function Z() {
  return Z = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var n = arguments[t];
      for (var r in n) ({}).hasOwnProperty.call(n, r) && (e[r] = n[r]);
    }
    return e;
  }, Z.apply(null, arguments);
}
function ow(e, t) {
  if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
}
function Uc(e, t) {
  for (var n = 0; n < t.length; n++) {
    var r = t[n];
    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, tf(r.key), r);
  }
}
function kl(e, t, n) {
  return t && Uc(e.prototype, t), n && Uc(e, n), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}
function $i(e, t) {
  return $i = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(n, r) {
    return n.__proto__ = r, n;
  }, $i(e, t);
}
function sw(e, t) {
  if (typeof t != "function" && t !== null) throw new TypeError("Super expression must either be null or a function");
  e.prototype = Object.create(t && t.prototype, {
    constructor: {
      value: e,
      writable: !0,
      configurable: !0
    }
  }), Object.defineProperty(e, "prototype", {
    writable: !1
  }), t && $i(e, t);
}
function Fi(e) {
  return Fi = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, Fi(e);
}
function rf() {
  try {
    var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch {
  }
  return (rf = function() {
    return !!e;
  })();
}
function qs(e) {
  if (e === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
function lw(e, t) {
  if (t && (Sr(t) == "object" || typeof t == "function")) return t;
  if (t !== void 0) throw new TypeError("Derived constructors may only return object or undefined");
  return qs(e);
}
function cw(e) {
  var t = rf();
  return function() {
    var n, r = Fi(e);
    if (t) {
      var a = Fi(this).constructor;
      n = Reflect.construct(r, arguments, a);
    } else n = r.apply(this, arguments);
    return lw(this, n);
  };
}
function uw(e) {
  if (Array.isArray(e)) return zs(e);
}
function dw(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function fw() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ro(e) {
  return uw(e) || dw(e) || nf(e) || fw();
}
function pw(e) {
  if (e.sheet)
    return e.sheet;
  for (var t = 0; t < document.styleSheets.length; t++)
    if (document.styleSheets[t].ownerNode === e)
      return document.styleSheets[t];
}
function mw(e) {
  var t = document.createElement("style");
  return t.setAttribute("data-emotion", e.key), e.nonce !== void 0 && t.setAttribute("nonce", e.nonce), t.appendChild(document.createTextNode("")), t.setAttribute("data-s", ""), t;
}
var gw = /* @__PURE__ */ function() {
  function e(n) {
    var r = this;
    this._insertTag = function(a) {
      var i;
      r.tags.length === 0 ? r.insertionPoint ? i = r.insertionPoint.nextSibling : r.prepend ? i = r.container.firstChild : i = r.before : i = r.tags[r.tags.length - 1].nextSibling, r.container.insertBefore(a, i), r.tags.push(a);
    }, this.isSpeedy = n.speedy === void 0 ? !0 : n.speedy, this.tags = [], this.ctr = 0, this.nonce = n.nonce, this.key = n.key, this.container = n.container, this.prepend = n.prepend, this.insertionPoint = n.insertionPoint, this.before = null;
  }
  var t = e.prototype;
  return t.hydrate = function(r) {
    r.forEach(this._insertTag);
  }, t.insert = function(r) {
    this.ctr % (this.isSpeedy ? 65e3 : 1) === 0 && this._insertTag(mw(this));
    var a = this.tags[this.tags.length - 1];
    if (this.isSpeedy) {
      var i = pw(a);
      try {
        i.insertRule(r, i.cssRules.length);
      } catch {
      }
    } else
      a.appendChild(document.createTextNode(r));
    this.ctr++;
  }, t.flush = function() {
    this.tags.forEach(function(r) {
      var a;
      return (a = r.parentNode) == null ? void 0 : a.removeChild(r);
    }), this.tags = [], this.ctr = 0;
  }, e;
}(), gn = "-ms-", _i = "-moz-", wt = "-webkit-", af = "comm", Pl = "rule", Nl = "decl", hw = "@import", of = "@keyframes", vw = "@layer", yw = Math.abs, ao = String.fromCharCode, bw = Object.assign;
function ww(e, t) {
  return cn(e, 0) ^ 45 ? (((t << 2 ^ cn(e, 0)) << 2 ^ cn(e, 1)) << 2 ^ cn(e, 2)) << 2 ^ cn(e, 3) : 0;
}
function sf(e) {
  return e.trim();
}
function xw(e, t) {
  return (e = t.exec(e)) ? e[0] : e;
}
function xt(e, t, n) {
  return e.replace(t, n);
}
function Ws(e, t) {
  return e.indexOf(t);
}
function cn(e, t) {
  return e.charCodeAt(t) | 0;
}
function Va(e, t, n) {
  return e.slice(t, n);
}
function Kn(e) {
  return e.length;
}
function Rl(e) {
  return e.length;
}
function pi(e, t) {
  return t.push(e), e;
}
function Ew(e, t) {
  return e.map(t).join("");
}
var io = 1, la = 1, lf = 0, Tn = 0, Gt = 0, ma = "";
function oo(e, t, n, r, a, i, s) {
  return { value: e, root: t, parent: n, type: r, props: a, children: i, line: io, column: la, length: s, return: "" };
}
function Ra(e, t) {
  return bw(oo("", null, null, "", null, null, 0), e, { length: -e.length }, t);
}
function Lw() {
  return Gt;
}
function Cw() {
  return Gt = Tn > 0 ? cn(ma, --Tn) : 0, la--, Gt === 10 && (la = 1, io--), Gt;
}
function Pn() {
  return Gt = Tn < lf ? cn(ma, Tn++) : 0, la++, Gt === 10 && (la = 1, io++), Gt;
}
function tr() {
  return cn(ma, Tn);
}
function Si() {
  return Tn;
}
function Wa(e, t) {
  return Va(ma, e, t);
}
function Ua(e) {
  switch (e) {
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    case 59:
    case 123:
    case 125:
      return 4;
    case 58:
      return 3;
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    case 41:
    case 93:
      return 1;
  }
  return 0;
}
function cf(e) {
  return io = la = 1, lf = Kn(ma = e), Tn = 0, [];
}
function uf(e) {
  return ma = "", e;
}
function Ti(e) {
  return sf(Wa(Tn - 1, Ys(e === 91 ? e + 2 : e === 40 ? e + 1 : e)));
}
function Sw(e) {
  for (; (Gt = tr()) && Gt < 33; )
    Pn();
  return Ua(e) > 2 || Ua(Gt) > 3 ? "" : " ";
}
function Tw(e, t) {
  for (; --t && Pn() && !(Gt < 48 || Gt > 102 || Gt > 57 && Gt < 65 || Gt > 70 && Gt < 97); )
    ;
  return Wa(e, Si() + (t < 6 && tr() == 32 && Pn() == 32));
}
function Ys(e) {
  for (; Pn(); )
    switch (Gt) {
      case e:
        return Tn;
      case 34:
      case 39:
        e !== 34 && e !== 39 && Ys(Gt);
        break;
      case 40:
        e === 41 && Ys(e);
        break;
      case 92:
        Pn();
        break;
    }
  return Tn;
}
function Dw(e, t) {
  for (; Pn() && e + Gt !== 57; )
    if (e + Gt === 84 && tr() === 47)
      break;
  return "/*" + Wa(t, Tn - 1) + "*" + ao(e === 47 ? e : Pn());
}
function kw(e) {
  for (; !Ua(tr()); )
    Pn();
  return Wa(e, Tn);
}
function Pw(e) {
  return uf(Di("", null, null, null, [""], e = cf(e), 0, [0], e));
}
function Di(e, t, n, r, a, i, s, c, u) {
  for (var p = 0, g = 0, v = s, y = 0, E = 0, L = 0, x = 1, C = 1, T = 1, D = 0, k = "", N = a, R = i, A = r, f = k; C; )
    switch (L = D, D = Pn()) {
      case 40:
        if (L != 108 && cn(f, v - 1) == 58) {
          Ws(f += xt(Ti(D), "&", "&\f"), "&\f") != -1 && (T = -1);
          break;
        }
      case 34:
      case 39:
      case 91:
        f += Ti(D);
        break;
      case 9:
      case 10:
      case 13:
      case 32:
        f += Sw(L);
        break;
      case 92:
        f += Tw(Si() - 1, 7);
        continue;
      case 47:
        switch (tr()) {
          case 42:
          case 47:
            pi(Nw(Dw(Pn(), Si()), t, n), u);
            break;
          default:
            f += "/";
        }
        break;
      case 123 * x:
        c[p++] = Kn(f) * T;
      case 125 * x:
      case 59:
      case 0:
        switch (D) {
          case 0:
          case 125:
            C = 0;
          case 59 + g:
            T == -1 && (f = xt(f, /\f/g, "")), E > 0 && Kn(f) - v && pi(E > 32 ? Hc(f + ";", r, n, v - 1) : Hc(xt(f, " ", "") + ";", r, n, v - 2), u);
            break;
          case 59:
            f += ";";
          default:
            if (pi(A = Bc(f, t, n, p, g, a, c, k, N = [], R = [], v), i), D === 123)
              if (g === 0)
                Di(f, t, A, A, N, i, v, c, R);
              else
                switch (y === 99 && cn(f, 3) === 110 ? 100 : y) {
                  case 100:
                  case 108:
                  case 109:
                  case 115:
                    Di(e, A, A, r && pi(Bc(e, A, A, 0, 0, a, c, k, a, N = [], v), R), a, R, v, c, r ? N : R);
                    break;
                  default:
                    Di(f, A, A, A, [""], R, 0, c, R);
                }
        }
        p = g = E = 0, x = T = 1, k = f = "", v = s;
        break;
      case 58:
        v = 1 + Kn(f), E = L;
      default:
        if (x < 1) {
          if (D == 123)
            --x;
          else if (D == 125 && x++ == 0 && Cw() == 125)
            continue;
        }
        switch (f += ao(D), D * x) {
          case 38:
            T = g > 0 ? 1 : (f += "\f", -1);
            break;
          case 44:
            c[p++] = (Kn(f) - 1) * T, T = 1;
            break;
          case 64:
            tr() === 45 && (f += Ti(Pn())), y = tr(), g = v = Kn(k = f += kw(Si())), D++;
            break;
          case 45:
            L === 45 && Kn(f) == 2 && (x = 0);
        }
    }
  return i;
}
function Bc(e, t, n, r, a, i, s, c, u, p, g) {
  for (var v = a - 1, y = a === 0 ? i : [""], E = Rl(y), L = 0, x = 0, C = 0; L < r; ++L)
    for (var T = 0, D = Va(e, v + 1, v = yw(x = s[L])), k = e; T < E; ++T)
      (k = sf(x > 0 ? y[T] + " " + D : xt(D, /&\f/g, y[T]))) && (u[C++] = k);
  return oo(e, t, n, a === 0 ? Pl : c, u, p, g);
}
function Nw(e, t, n) {
  return oo(e, t, n, af, ao(Lw()), Va(e, 2, -2), 0);
}
function Hc(e, t, n, r) {
  return oo(e, t, n, Nl, Va(e, 0, r), Va(e, r + 1, -1), r);
}
function ia(e, t) {
  for (var n = "", r = Rl(e), a = 0; a < r; a++)
    n += t(e[a], a, e, t) || "";
  return n;
}
function Rw(e, t, n, r) {
  switch (e.type) {
    case vw:
      if (e.children.length) break;
    case hw:
    case Nl:
      return e.return = e.return || e.value;
    case af:
      return "";
    case of:
      return e.return = e.value + "{" + ia(e.children, r) + "}";
    case Pl:
      e.value = e.props.join(",");
  }
  return Kn(n = ia(e.children, r)) ? e.return = e.value + "{" + n + "}" : "";
}
function Iw(e) {
  var t = Rl(e);
  return function(n, r, a, i) {
    for (var s = "", c = 0; c < t; c++)
      s += e[c](n, r, a, i) || "";
    return s;
  };
}
function Aw(e) {
  return function(t) {
    t.root || (t = t.return) && e(t);
  };
}
function Ow(e) {
  var t = /* @__PURE__ */ Object.create(null);
  return function(n) {
    return t[n] === void 0 && (t[n] = e(n)), t[n];
  };
}
var Mw = function(t, n, r) {
  for (var a = 0, i = 0; a = i, i = tr(), a === 38 && i === 12 && (n[r] = 1), !Ua(i); )
    Pn();
  return Wa(t, Tn);
}, $w = function(t, n) {
  var r = -1, a = 44;
  do
    switch (Ua(a)) {
      case 0:
        a === 38 && tr() === 12 && (n[r] = 1), t[r] += Mw(Tn - 1, n, r);
        break;
      case 2:
        t[r] += Ti(a);
        break;
      case 4:
        if (a === 44) {
          t[++r] = tr() === 58 ? "&\f" : "", n[r] = t[r].length;
          break;
        }
      default:
        t[r] += ao(a);
    }
  while (a = Pn());
  return t;
}, Fw = function(t, n) {
  return uf($w(cf(t), n));
}, zc = /* @__PURE__ */ new WeakMap(), _w = function(t) {
  if (!(t.type !== "rule" || !t.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  t.length < 1)) {
    for (var n = t.value, r = t.parent, a = t.column === r.column && t.line === r.line; r.type !== "rule"; )
      if (r = r.parent, !r) return;
    if (!(t.props.length === 1 && n.charCodeAt(0) !== 58 && !zc.get(r)) && !a) {
      zc.set(t, !0);
      for (var i = [], s = Fw(n, i), c = r.props, u = 0, p = 0; u < s.length; u++)
        for (var g = 0; g < c.length; g++, p++)
          t.props[p] = i[u] ? s[u].replace(/&\f/g, c[g]) : c[g] + " " + s[u];
    }
  }
}, jw = function(t) {
  if (t.type === "decl") {
    var n = t.value;
    // charcode for l
    n.charCodeAt(0) === 108 && // charcode for b
    n.charCodeAt(2) === 98 && (t.return = "", t.value = "");
  }
};
function df(e, t) {
  switch (ww(e, t)) {
    case 5103:
      return wt + "print-" + e + e;
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855:
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return wt + e + e;
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return wt + e + _i + e + gn + e + e;
    case 6828:
    case 4268:
      return wt + e + gn + e + e;
    case 6165:
      return wt + e + gn + "flex-" + e + e;
    case 5187:
      return wt + e + xt(e, /(\w+).+(:[^]+)/, wt + "box-$1$2" + gn + "flex-$1$2") + e;
    case 5443:
      return wt + e + gn + "flex-item-" + xt(e, /flex-|-self/, "") + e;
    case 4675:
      return wt + e + gn + "flex-line-pack" + xt(e, /align-content|flex-|-self/, "") + e;
    case 5548:
      return wt + e + gn + xt(e, "shrink", "negative") + e;
    case 5292:
      return wt + e + gn + xt(e, "basis", "preferred-size") + e;
    case 6060:
      return wt + "box-" + xt(e, "-grow", "") + wt + e + gn + xt(e, "grow", "positive") + e;
    case 4554:
      return wt + xt(e, /([^-])(transform)/g, "$1" + wt + "$2") + e;
    case 6187:
      return xt(xt(xt(e, /(zoom-|grab)/, wt + "$1"), /(image-set)/, wt + "$1"), e, "") + e;
    case 5495:
    case 3959:
      return xt(e, /(image-set\([^]*)/, wt + "$1$`$1");
    case 4968:
      return xt(xt(e, /(.+:)(flex-)?(.*)/, wt + "box-pack:$3" + gn + "flex-pack:$3"), /s.+-b[^;]+/, "justify") + wt + e + e;
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return xt(e, /(.+)-inline(.+)/, wt + "$1$2") + e;
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if (Kn(e) - 1 - t > 6) switch (cn(e, t + 1)) {
        case 109:
          if (cn(e, t + 4) !== 45) break;
        case 102:
          return xt(e, /(.+:)(.+)-([^]+)/, "$1" + wt + "$2-$3$1" + _i + (cn(e, t + 3) == 108 ? "$3" : "$2-$3")) + e;
        case 115:
          return ~Ws(e, "stretch") ? df(xt(e, "stretch", "fill-available"), t) + e : e;
      }
      break;
    case 4949:
      if (cn(e, t + 1) !== 115) break;
    case 6444:
      switch (cn(e, Kn(e) - 3 - (~Ws(e, "!important") && 10))) {
        case 107:
          return xt(e, ":", ":" + wt) + e;
        case 101:
          return xt(e, /(.+:)([^;!]+)(;|!.+)?/, "$1" + wt + (cn(e, 14) === 45 ? "inline-" : "") + "box$3$1" + wt + "$2$3$1" + gn + "$2box$3") + e;
      }
      break;
    case 5936:
      switch (cn(e, t + 11)) {
        case 114:
          return wt + e + gn + xt(e, /[svh]\w+-[tblr]{2}/, "tb") + e;
        case 108:
          return wt + e + gn + xt(e, /[svh]\w+-[tblr]{2}/, "tb-rl") + e;
        case 45:
          return wt + e + gn + xt(e, /[svh]\w+-[tblr]{2}/, "lr") + e;
      }
      return wt + e + gn + e + e;
  }
  return e;
}
var Vw = function(t, n, r, a) {
  if (t.length > -1 && !t.return) switch (t.type) {
    case Nl:
      t.return = df(t.value, t.length);
      break;
    case of:
      return ia([Ra(t, {
        value: xt(t.value, "@", "@" + wt)
      })], a);
    case Pl:
      if (t.length) return Ew(t.props, function(i) {
        switch (xw(i, /(::plac\w+|:read-\w+)/)) {
          case ":read-only":
          case ":read-write":
            return ia([Ra(t, {
              props: [xt(i, /:(read-\w+)/, ":" + _i + "$1")]
            })], a);
          case "::placeholder":
            return ia([Ra(t, {
              props: [xt(i, /:(plac\w+)/, ":" + wt + "input-$1")]
            }), Ra(t, {
              props: [xt(i, /:(plac\w+)/, ":" + _i + "$1")]
            }), Ra(t, {
              props: [xt(i, /:(plac\w+)/, gn + "input-$1")]
            })], a);
        }
        return "";
      });
  }
}, Uw = [Vw], Bw = function(t) {
  var n = t.key;
  if (n === "css") {
    var r = document.querySelectorAll("style[data-emotion]:not([data-s])");
    Array.prototype.forEach.call(r, function(x) {
      var C = x.getAttribute("data-emotion");
      C.indexOf(" ") !== -1 && (document.head.appendChild(x), x.setAttribute("data-s", ""));
    });
  }
  var a = t.stylisPlugins || Uw, i = {}, s, c = [];
  s = t.container || document.head, Array.prototype.forEach.call(
    // this means we will ignore elements which don't have a space in them which
    // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
    document.querySelectorAll('style[data-emotion^="' + n + ' "]'),
    function(x) {
      for (var C = x.getAttribute("data-emotion").split(" "), T = 1; T < C.length; T++)
        i[C[T]] = !0;
      c.push(x);
    }
  );
  var u, p = [_w, jw];
  {
    var g, v = [Rw, Aw(function(x) {
      g.insert(x);
    })], y = Iw(p.concat(a, v)), E = function(C) {
      return ia(Pw(C), y);
    };
    u = function(C, T, D, k) {
      g = D, E(C ? C + "{" + T.styles + "}" : T.styles), k && (L.inserted[T.name] = !0);
    };
  }
  var L = {
    key: n,
    sheet: new gw({
      key: n,
      container: s,
      nonce: t.nonce,
      speedy: t.speedy,
      prepend: t.prepend,
      insertionPoint: t.insertionPoint
    }),
    nonce: t.nonce,
    inserted: i,
    registered: {},
    insert: u
  };
  return L.sheet.hydrate(c), L;
}, ff = { exports: {} }, Pt = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var sn = typeof Symbol == "function" && Symbol.for, Il = sn ? Symbol.for("react.element") : 60103, Al = sn ? Symbol.for("react.portal") : 60106, so = sn ? Symbol.for("react.fragment") : 60107, lo = sn ? Symbol.for("react.strict_mode") : 60108, co = sn ? Symbol.for("react.profiler") : 60114, uo = sn ? Symbol.for("react.provider") : 60109, fo = sn ? Symbol.for("react.context") : 60110, Ol = sn ? Symbol.for("react.async_mode") : 60111, po = sn ? Symbol.for("react.concurrent_mode") : 60111, mo = sn ? Symbol.for("react.forward_ref") : 60112, go = sn ? Symbol.for("react.suspense") : 60113, Hw = sn ? Symbol.for("react.suspense_list") : 60120, ho = sn ? Symbol.for("react.memo") : 60115, vo = sn ? Symbol.for("react.lazy") : 60116, zw = sn ? Symbol.for("react.block") : 60121, qw = sn ? Symbol.for("react.fundamental") : 60117, Ww = sn ? Symbol.for("react.responder") : 60118, Yw = sn ? Symbol.for("react.scope") : 60119;
function Nn(e) {
  if (typeof e == "object" && e !== null) {
    var t = e.$$typeof;
    switch (t) {
      case Il:
        switch (e = e.type, e) {
          case Ol:
          case po:
          case so:
          case co:
          case lo:
          case go:
            return e;
          default:
            switch (e = e && e.$$typeof, e) {
              case fo:
              case mo:
              case vo:
              case ho:
              case uo:
                return e;
              default:
                return t;
            }
        }
      case Al:
        return t;
    }
  }
}
function pf(e) {
  return Nn(e) === po;
}
Pt.AsyncMode = Ol;
Pt.ConcurrentMode = po;
Pt.ContextConsumer = fo;
Pt.ContextProvider = uo;
Pt.Element = Il;
Pt.ForwardRef = mo;
Pt.Fragment = so;
Pt.Lazy = vo;
Pt.Memo = ho;
Pt.Portal = Al;
Pt.Profiler = co;
Pt.StrictMode = lo;
Pt.Suspense = go;
Pt.isAsyncMode = function(e) {
  return pf(e) || Nn(e) === Ol;
};
Pt.isConcurrentMode = pf;
Pt.isContextConsumer = function(e) {
  return Nn(e) === fo;
};
Pt.isContextProvider = function(e) {
  return Nn(e) === uo;
};
Pt.isElement = function(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Il;
};
Pt.isForwardRef = function(e) {
  return Nn(e) === mo;
};
Pt.isFragment = function(e) {
  return Nn(e) === so;
};
Pt.isLazy = function(e) {
  return Nn(e) === vo;
};
Pt.isMemo = function(e) {
  return Nn(e) === ho;
};
Pt.isPortal = function(e) {
  return Nn(e) === Al;
};
Pt.isProfiler = function(e) {
  return Nn(e) === co;
};
Pt.isStrictMode = function(e) {
  return Nn(e) === lo;
};
Pt.isSuspense = function(e) {
  return Nn(e) === go;
};
Pt.isValidElementType = function(e) {
  return typeof e == "string" || typeof e == "function" || e === so || e === po || e === co || e === lo || e === go || e === Hw || typeof e == "object" && e !== null && (e.$$typeof === vo || e.$$typeof === ho || e.$$typeof === uo || e.$$typeof === fo || e.$$typeof === mo || e.$$typeof === qw || e.$$typeof === Ww || e.$$typeof === Yw || e.$$typeof === zw);
};
Pt.typeOf = Nn;
ff.exports = Pt;
var Gw = ff.exports, Ml = Gw, Kw = {
  childContextTypes: !0,
  contextType: !0,
  contextTypes: !0,
  defaultProps: !0,
  displayName: !0,
  getDefaultProps: !0,
  getDerivedStateFromError: !0,
  getDerivedStateFromProps: !0,
  mixins: !0,
  propTypes: !0,
  type: !0
}, Jw = {
  name: !0,
  length: !0,
  prototype: !0,
  caller: !0,
  callee: !0,
  arguments: !0,
  arity: !0
}, Qw = {
  $$typeof: !0,
  render: !0,
  defaultProps: !0,
  displayName: !0,
  propTypes: !0
}, mf = {
  $$typeof: !0,
  compare: !0,
  defaultProps: !0,
  displayName: !0,
  propTypes: !0,
  type: !0
}, $l = {};
$l[Ml.ForwardRef] = Qw;
$l[Ml.Memo] = mf;
function qc(e) {
  return Ml.isMemo(e) ? mf : $l[e.$$typeof] || Kw;
}
var Xw = Object.defineProperty, Zw = Object.getOwnPropertyNames, Wc = Object.getOwnPropertySymbols, ex = Object.getOwnPropertyDescriptor, tx = Object.getPrototypeOf, Yc = Object.prototype;
function gf(e, t, n) {
  if (typeof t != "string") {
    if (Yc) {
      var r = tx(t);
      r && r !== Yc && gf(e, r, n);
    }
    var a = Zw(t);
    Wc && (a = a.concat(Wc(t)));
    for (var i = qc(e), s = qc(t), c = 0; c < a.length; ++c) {
      var u = a[c];
      if (!Jw[u] && !(n && n[u]) && !(s && s[u]) && !(i && i[u])) {
        var p = ex(t, u);
        try {
          Xw(e, u, p);
        } catch {
        }
      }
    }
  }
  return e;
}
var nx = gf;
const rx = /* @__PURE__ */ no(nx);
var ax = !0;
function ix(e, t, n) {
  var r = "";
  return n.split(" ").forEach(function(a) {
    e[a] !== void 0 ? t.push(e[a] + ";") : a && (r += a + " ");
  }), r;
}
var hf = function(t, n, r) {
  var a = t.key + "-" + n.name;
  // we only need to add the styles to the registered cache if the
  // class name could be used further down
  // the tree but if it's a string tag, we know it won't
  // so we don't have to add it to registered cache.
  // this improves memory usage since we can avoid storing the whole style string
  (r === !1 || // we need to always store it if we're in compat mode and
  // in node since emotion-server relies on whether a style is in
  // the registered cache to know whether a style is global or not
  // also, note that this check will be dead code eliminated in the browser
  ax === !1) && t.registered[a] === void 0 && (t.registered[a] = n.styles);
}, ox = function(t, n, r) {
  hf(t, n, r);
  var a = t.key + "-" + n.name;
  if (t.inserted[n.name] === void 0) {
    var i = n;
    do
      t.insert(n === i ? "." + a : "", i, t.sheet, !0), i = i.next;
    while (i !== void 0);
  }
};
function sx(e) {
  for (var t = 0, n, r = 0, a = e.length; a >= 4; ++r, a -= 4)
    n = e.charCodeAt(r) & 255 | (e.charCodeAt(++r) & 255) << 8 | (e.charCodeAt(++r) & 255) << 16 | (e.charCodeAt(++r) & 255) << 24, n = /* Math.imul(k, m): */
    (n & 65535) * 1540483477 + ((n >>> 16) * 59797 << 16), n ^= /* k >>> r: */
    n >>> 24, t = /* Math.imul(k, m): */
    (n & 65535) * 1540483477 + ((n >>> 16) * 59797 << 16) ^ /* Math.imul(h, m): */
    (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16);
  switch (a) {
    case 3:
      t ^= (e.charCodeAt(r + 2) & 255) << 16;
    case 2:
      t ^= (e.charCodeAt(r + 1) & 255) << 8;
    case 1:
      t ^= e.charCodeAt(r) & 255, t = /* Math.imul(h, m): */
      (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16);
  }
  return t ^= t >>> 13, t = /* Math.imul(h, m): */
  (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16), ((t ^ t >>> 15) >>> 0).toString(36);
}
var lx = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
}, cx = /[A-Z]|^ms/g, ux = /_EMO_([^_]+?)_([^]*?)_EMO_/g, vf = function(t) {
  return t.charCodeAt(1) === 45;
}, Gc = function(t) {
  return t != null && typeof t != "boolean";
}, es = /* @__PURE__ */ Ow(function(e) {
  return vf(e) ? e : e.replace(cx, "-$&").toLowerCase();
}), Kc = function(t, n) {
  switch (t) {
    case "animation":
    case "animationName":
      if (typeof n == "string")
        return n.replace(ux, function(r, a, i) {
          return Jn = {
            name: a,
            styles: i,
            next: Jn
          }, a;
        });
  }
  return lx[t] !== 1 && !vf(t) && typeof n == "number" && n !== 0 ? n + "px" : n;
};
function Ba(e, t, n) {
  if (n == null)
    return "";
  var r = n;
  if (r.__emotion_styles !== void 0)
    return r;
  switch (typeof n) {
    case "boolean":
      return "";
    case "object": {
      var a = n;
      if (a.anim === 1)
        return Jn = {
          name: a.name,
          styles: a.styles,
          next: Jn
        }, a.name;
      var i = n;
      if (i.styles !== void 0) {
        var s = i.next;
        if (s !== void 0)
          for (; s !== void 0; )
            Jn = {
              name: s.name,
              styles: s.styles,
              next: Jn
            }, s = s.next;
        var c = i.styles + ";";
        return c;
      }
      return dx(e, t, n);
    }
    case "function": {
      if (e !== void 0) {
        var u = Jn, p = n(e);
        return Jn = u, Ba(e, t, p);
      }
      break;
    }
  }
  var g = n;
  return g;
}
function dx(e, t, n) {
  var r = "";
  if (Array.isArray(n))
    for (var a = 0; a < n.length; a++)
      r += Ba(e, t, n[a]) + ";";
  else
    for (var i in n) {
      var s = n[i];
      if (typeof s != "object") {
        var c = s;
        Gc(c) && (r += es(i) + ":" + Kc(i, c) + ";");
      } else if (Array.isArray(s) && typeof s[0] == "string" && t == null)
        for (var u = 0; u < s.length; u++)
          Gc(s[u]) && (r += es(i) + ":" + Kc(i, s[u]) + ";");
      else {
        var p = Ba(e, t, s);
        switch (i) {
          case "animation":
          case "animationName": {
            r += es(i) + ":" + p + ";";
            break;
          }
          default:
            r += i + "{" + p + "}";
        }
      }
    }
  return r;
}
var Jc = /label:\s*([^\s;{]+)\s*(;|$)/g, Jn;
function yf(e, t, n) {
  if (e.length === 1 && typeof e[0] == "object" && e[0] !== null && e[0].styles !== void 0)
    return e[0];
  var r = !0, a = "";
  Jn = void 0;
  var i = e[0];
  if (i == null || i.raw === void 0)
    r = !1, a += Ba(n, t, i);
  else {
    var s = i;
    a += s[0];
  }
  for (var c = 1; c < e.length; c++)
    if (a += Ba(n, t, e[c]), r) {
      var u = i;
      a += u[c];
    }
  Jc.lastIndex = 0;
  for (var p = "", g; (g = Jc.exec(a)) !== null; )
    p += "-" + g[1];
  var v = sx(a) + p;
  return {
    name: v,
    styles: a,
    next: Jn
  };
}
var fx = function(t) {
  return t();
}, px = le.useInsertionEffect ? le.useInsertionEffect : !1, mx = px || fx, bf = /* @__PURE__ */ le.createContext(
  // we're doing this to avoid preconstruct's dead code elimination in this one case
  // because this module is primarily intended for the browser and node
  // but it's also required in react native and similar environments sometimes
  // and we could have a special build just for that
  // but this is much easier and the native packages
  // might use a different theme context in the future anyway
  typeof HTMLElement < "u" ? /* @__PURE__ */ Bw({
    key: "css"
  }) : null
);
bf.Provider;
var gx = function(t) {
  return /* @__PURE__ */ Xi(function(n, r) {
    var a = Un(bf);
    return t(n, a, r);
  });
}, hx = /* @__PURE__ */ le.createContext({}), Fl = {}.hasOwnProperty, Gs = "__EMOTION_TYPE_PLEASE_DO_NOT_USE__", vx = function(t, n) {
  var r = {};
  for (var a in n)
    Fl.call(n, a) && (r[a] = n[a]);
  return r[Gs] = t, r;
}, yx = function(t) {
  var n = t.cache, r = t.serialized, a = t.isStringTag;
  return hf(n, r, a), mx(function() {
    return ox(n, r, a);
  }), null;
}, bx = /* @__PURE__ */ gx(function(e, t, n) {
  var r = e.css;
  typeof r == "string" && t.registered[r] !== void 0 && (r = t.registered[r]);
  var a = e[Gs], i = [r], s = "";
  typeof e.className == "string" ? s = ix(t.registered, i, e.className) : e.className != null && (s = e.className + " ");
  var c = yf(i, void 0, le.useContext(hx));
  s += t.key + "-" + c.name;
  var u = {};
  for (var p in e)
    Fl.call(e, p) && p !== "css" && p !== Gs && (u[p] = e[p]);
  return u.className = s, n && (u.ref = n), /* @__PURE__ */ le.createElement(le.Fragment, null, /* @__PURE__ */ le.createElement(yx, {
    cache: t,
    serialized: c,
    isStringTag: typeof a == "string"
  }), /* @__PURE__ */ le.createElement(a, u));
}), wx = bx, je = function(t, n) {
  var r = arguments;
  if (n == null || !Fl.call(n, "css"))
    return le.createElement.apply(void 0, r);
  var a = r.length, i = new Array(a);
  i[0] = wx, i[1] = vx(t, n);
  for (var s = 2; s < a; s++)
    i[s] = r[s];
  return le.createElement.apply(null, i);
};
(function(e) {
  var t;
  t || (t = e.JSX || (e.JSX = {}));
})(je || (je = {}));
function _l() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return yf(t);
}
function xx() {
  var e = _l.apply(void 0, arguments), t = "animation-" + e.name;
  return {
    name: t,
    styles: "@keyframes " + t + "{" + e.styles + "}",
    anim: 1,
    toString: function() {
      return "_EMO_" + this.name + "_" + this.styles + "_EMO_";
    }
  };
}
function Ex(e, t) {
  return t || (t = e.slice(0)), Object.freeze(Object.defineProperties(e, {
    raw: {
      value: Object.freeze(t)
    }
  }));
}
const Lx = Math.min, Cx = Math.max, ji = Math.round, mi = Math.floor, Vi = (e) => ({
  x: e,
  y: e
});
function Sx(e) {
  const {
    x: t,
    y: n,
    width: r,
    height: a
  } = e;
  return {
    width: r,
    height: a,
    top: n,
    left: t,
    right: t + r,
    bottom: n + a,
    x: t,
    y: n
  };
}
function yo() {
  return typeof window < "u";
}
function wf(e) {
  return Ef(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function lr(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function xf(e) {
  var t;
  return (t = (Ef(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Ef(e) {
  return yo() ? e instanceof Node || e instanceof lr(e).Node : !1;
}
function Tx(e) {
  return yo() ? e instanceof Element || e instanceof lr(e).Element : !1;
}
function jl(e) {
  return yo() ? e instanceof HTMLElement || e instanceof lr(e).HTMLElement : !1;
}
function Qc(e) {
  return !yo() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof lr(e).ShadowRoot;
}
function Lf(e) {
  const {
    overflow: t,
    overflowX: n,
    overflowY: r,
    display: a
  } = Vl(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && a !== "inline" && a !== "contents";
}
let ts;
function Dx() {
  return ts == null && (ts = typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none")), ts;
}
function kx(e) {
  return /^(html|body|#document)$/.test(wf(e));
}
function Vl(e) {
  return lr(e).getComputedStyle(e);
}
function Px(e) {
  if (wf(e) === "html")
    return e;
  const t = (
    // Step into the shadow DOM of the parent of a slotted node.
    e.assignedSlot || // DOM Element detected.
    e.parentNode || // ShadowRoot detected.
    Qc(e) && e.host || // Fallback.
    xf(e)
  );
  return Qc(t) ? t.host : t;
}
function Cf(e) {
  const t = Px(e);
  return kx(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : jl(t) && Lf(t) ? t : Cf(t);
}
function Ui(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const a = Cf(e), i = a === ((r = e.ownerDocument) == null ? void 0 : r.body), s = lr(a);
  if (i) {
    const c = Ks(s);
    return t.concat(s, s.visualViewport || [], Lf(a) ? a : [], c && n ? Ui(c) : []);
  } else
    return t.concat(a, Ui(a, [], n));
}
function Ks(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function Nx(e) {
  const t = Vl(e);
  let n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0;
  const a = jl(e), i = a ? e.offsetWidth : n, s = a ? e.offsetHeight : r, c = ji(n) !== i || ji(r) !== s;
  return c && (n = i, r = s), {
    width: n,
    height: r,
    $: c
  };
}
function Ul(e) {
  return Tx(e) ? e : e.contextElement;
}
function Xc(e) {
  const t = Ul(e);
  if (!jl(t))
    return Vi(1);
  const n = t.getBoundingClientRect(), {
    width: r,
    height: a,
    $: i
  } = Nx(t);
  let s = (i ? ji(n.width) : n.width) / r, c = (i ? ji(n.height) : n.height) / a;
  return (!s || !Number.isFinite(s)) && (s = 1), (!c || !Number.isFinite(c)) && (c = 1), {
    x: s,
    y: c
  };
}
const Rx = /* @__PURE__ */ Vi(0);
function Ix(e) {
  const t = lr(e);
  return !Dx() || !t.visualViewport ? Rx : {
    x: t.visualViewport.offsetLeft,
    y: t.visualViewport.offsetTop
  };
}
function Ax(e, t, n) {
  return !1;
}
function Zc(e, t, n, r) {
  t === void 0 && (t = !1);
  const a = e.getBoundingClientRect(), i = Ul(e);
  let s = Vi(1);
  t && (s = Xc(e));
  const c = Ax() ? Ix(i) : Vi(0);
  let u = (a.left + c.x) / s.x, p = (a.top + c.y) / s.y, g = a.width / s.x, v = a.height / s.y;
  if (i) {
    const y = lr(i), E = r;
    let L = y, x = Ks(L);
    for (; x && r && E !== L; ) {
      const C = Xc(x), T = x.getBoundingClientRect(), D = Vl(x), k = T.left + (x.clientLeft + parseFloat(D.paddingLeft)) * C.x, N = T.top + (x.clientTop + parseFloat(D.paddingTop)) * C.y;
      u *= C.x, p *= C.y, g *= C.x, v *= C.y, u += k, p += N, L = lr(x), x = Ks(L);
    }
  }
  return Sx({
    width: g,
    height: v,
    x: u,
    y: p
  });
}
function Sf(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Ox(e, t) {
  let n = null, r;
  const a = xf(e);
  function i() {
    var c;
    clearTimeout(r), (c = n) == null || c.disconnect(), n = null;
  }
  function s(c, u) {
    c === void 0 && (c = !1), u === void 0 && (u = 1), i();
    const p = e.getBoundingClientRect(), {
      left: g,
      top: v,
      width: y,
      height: E
    } = p;
    if (c || t(), !y || !E)
      return;
    const L = mi(v), x = mi(a.clientWidth - (g + y)), C = mi(a.clientHeight - (v + E)), T = mi(g), k = {
      rootMargin: -L + "px " + -x + "px " + -C + "px " + -T + "px",
      threshold: Cx(0, Lx(1, u)) || 1
    };
    let N = !0;
    function R(A) {
      const f = A[0].intersectionRatio;
      if (f !== u) {
        if (!N)
          return s();
        f ? s(!1, f) : r = setTimeout(() => {
          s(!1, 1e-7);
        }, 1e3);
      }
      f === 1 && !Sf(p, e.getBoundingClientRect()) && s(), N = !1;
    }
    try {
      n = new IntersectionObserver(R, {
        ...k,
        // Handle <iframe>s
        root: a.ownerDocument
      });
    } catch {
      n = new IntersectionObserver(R, k);
    }
    n.observe(e);
  }
  return s(!0), i;
}
function Mx(e, t, n, r) {
  r === void 0 && (r = {});
  const {
    ancestorScroll: a = !0,
    ancestorResize: i = !0,
    elementResize: s = typeof ResizeObserver == "function",
    layoutShift: c = typeof IntersectionObserver == "function",
    animationFrame: u = !1
  } = r, p = Ul(e), g = a || i ? [...p ? Ui(p) : [], ...t ? Ui(t) : []] : [];
  g.forEach((T) => {
    a && T.addEventListener("scroll", n, {
      passive: !0
    }), i && T.addEventListener("resize", n);
  });
  const v = p && c ? Ox(p, n) : null;
  let y = -1, E = null;
  s && (E = new ResizeObserver((T) => {
    let [D] = T;
    D && D.target === p && E && t && (E.unobserve(t), cancelAnimationFrame(y), y = requestAnimationFrame(() => {
      var k;
      (k = E) == null || k.observe(t);
    })), n();
  }), p && !u && E.observe(p), t && E.observe(t));
  let L, x = u ? Zc(e) : null;
  u && C();
  function C() {
    const T = Zc(e);
    x && !Sf(x, T) && n(), x = T, L = requestAnimationFrame(C);
  }
  return n(), () => {
    var T;
    g.forEach((D) => {
      a && D.removeEventListener("scroll", n), i && D.removeEventListener("resize", n);
    }), v == null || v(), (T = E) == null || T.disconnect(), E = null, u && cancelAnimationFrame(L);
  };
}
var Js = pm, $x = ["className", "clearValue", "cx", "getStyles", "getClassNames", "getValue", "hasValue", "isMulti", "isRtl", "options", "selectOption", "selectProps", "setValue", "theme"], Bi = function() {
};
function Fx(e, t) {
  return t ? t[0] === "-" ? e + t : e + "__" + t : e;
}
function _x(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  var i = [].concat(r);
  if (t && e)
    for (var s in t)
      t.hasOwnProperty(s) && t[s] && i.push("".concat(Fx(e, s)));
  return i.filter(function(c) {
    return c;
  }).map(function(c) {
    return String(c).trim();
  }).join(" ");
}
var eu = function(t) {
  return Yx(t) ? t.filter(Boolean) : Sr(t) === "object" && t !== null ? [t] : [];
}, Tf = function(t) {
  t.className, t.clearValue, t.cx, t.getStyles, t.getClassNames, t.getValue, t.hasValue, t.isMulti, t.isRtl, t.options, t.selectOption, t.selectProps, t.setValue, t.theme;
  var n = Jt(t, $x);
  return qe({}, n);
}, Ut = function(t, n, r) {
  var a = t.cx, i = t.getStyles, s = t.getClassNames, c = t.className;
  return {
    css: i(n, t),
    className: a(r ?? {}, s(n, t), c)
  };
};
function bo(e) {
  return [document.documentElement, document.body, window].indexOf(e) > -1;
}
function jx(e) {
  return bo(e) ? window.innerHeight : e.clientHeight;
}
function Df(e) {
  return bo(e) ? window.pageYOffset : e.scrollTop;
}
function Hi(e, t) {
  if (bo(e)) {
    window.scrollTo(0, t);
    return;
  }
  e.scrollTop = t;
}
function Vx(e) {
  var t = getComputedStyle(e), n = t.position === "absolute", r = /(auto|scroll)/;
  if (t.position === "fixed") return document.documentElement;
  for (var a = e; a = a.parentElement; )
    if (t = getComputedStyle(a), !(n && t.position === "static") && r.test(t.overflow + t.overflowY + t.overflowX))
      return a;
  return document.documentElement;
}
function Ux(e, t, n, r) {
  return n * ((e = e / r - 1) * e * e + 1) + t;
}
function gi(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 200, r = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : Bi, a = Df(e), i = t - a, s = 10, c = 0;
  function u() {
    c += s;
    var p = Ux(c, a, i, n);
    Hi(e, p), c < n ? window.requestAnimationFrame(u) : r(e);
  }
  u();
}
function tu(e, t) {
  var n = e.getBoundingClientRect(), r = t.getBoundingClientRect(), a = t.offsetHeight / 3;
  r.bottom + a > n.bottom ? Hi(e, Math.min(t.offsetTop + t.clientHeight - e.offsetHeight + a, e.scrollHeight)) : r.top - a < n.top && Hi(e, Math.max(t.offsetTop - a, 0));
}
function Bx(e) {
  var t = e.getBoundingClientRect();
  return {
    bottom: t.bottom,
    height: t.height,
    left: t.left,
    right: t.right,
    top: t.top,
    width: t.width
  };
}
function nu() {
  try {
    return document.createEvent("TouchEvent"), !0;
  } catch {
    return !1;
  }
}
function Hx() {
  try {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  } catch {
    return !1;
  }
}
var kf = !1, zx = {
  get passive() {
    return kf = !0;
  }
}, hi = typeof window < "u" ? window : {};
hi.addEventListener && hi.removeEventListener && (hi.addEventListener("p", Bi, zx), hi.removeEventListener("p", Bi, !1));
var qx = kf;
function Wx(e) {
  return e != null;
}
function Yx(e) {
  return Array.isArray(e);
}
function vi(e, t, n) {
  return e ? t : n;
}
var Gx = function(t) {
  for (var n = arguments.length, r = new Array(n > 1 ? n - 1 : 0), a = 1; a < n; a++)
    r[a - 1] = arguments[a];
  var i = Object.entries(t).filter(function(s) {
    var c = Vn(s, 1), u = c[0];
    return !r.includes(u);
  });
  return i.reduce(function(s, c) {
    var u = Vn(c, 2), p = u[0], g = u[1];
    return s[p] = g, s;
  }, {});
}, Kx = ["children", "innerProps"], Jx = ["children", "innerProps"];
function Qx(e) {
  var t = e.maxHeight, n = e.menuEl, r = e.minHeight, a = e.placement, i = e.shouldScroll, s = e.isFixedPosition, c = e.controlHeight, u = Vx(n), p = {
    placement: "bottom",
    maxHeight: t
  };
  if (!n || !n.offsetParent) return p;
  var g = u.getBoundingClientRect(), v = g.height, y = n.getBoundingClientRect(), E = y.bottom, L = y.height, x = y.top, C = n.offsetParent.getBoundingClientRect(), T = C.top, D = s ? window.innerHeight : jx(u), k = Df(u), N = parseInt(getComputedStyle(n).marginBottom, 10), R = parseInt(getComputedStyle(n).marginTop, 10), A = T - R, f = D - x, _ = A + k, O = v - k - x, J = E - D + k + N, ee = k + x - R, ge = 160;
  switch (a) {
    case "auto":
    case "bottom":
      if (f >= L)
        return {
          placement: "bottom",
          maxHeight: t
        };
      if (O >= L && !s)
        return i && gi(u, J, ge), {
          placement: "bottom",
          maxHeight: t
        };
      if (!s && O >= r || s && f >= r) {
        i && gi(u, J, ge);
        var ie = s ? f - N : O - N;
        return {
          placement: "bottom",
          maxHeight: ie
        };
      }
      if (a === "auto" || s) {
        var fe = t, be = s ? A : _;
        return be >= r && (fe = Math.min(be - N - c, t)), {
          placement: "top",
          maxHeight: fe
        };
      }
      if (a === "bottom")
        return i && Hi(u, J), {
          placement: "bottom",
          maxHeight: t
        };
      break;
    case "top":
      if (A >= L)
        return {
          placement: "top",
          maxHeight: t
        };
      if (_ >= L && !s)
        return i && gi(u, ee, ge), {
          placement: "top",
          maxHeight: t
        };
      if (!s && _ >= r || s && A >= r) {
        var $e = t;
        return (!s && _ >= r || s && A >= r) && ($e = s ? A - R : _ - R), i && gi(u, ee, ge), {
          placement: "top",
          maxHeight: $e
        };
      }
      return {
        placement: "bottom",
        maxHeight: t
      };
    default:
      throw new Error('Invalid placement provided "'.concat(a, '".'));
  }
  return p;
}
function Xx(e) {
  var t = {
    bottom: "top",
    top: "bottom"
  };
  return e ? t[e] : "bottom";
}
var Pf = function(t) {
  return t === "auto" ? "bottom" : t;
}, Zx = function(t, n) {
  var r, a = t.placement, i = t.theme, s = i.borderRadius, c = i.spacing, u = i.colors;
  return qe((r = {
    label: "menu"
  }, Mn(r, Xx(a), "100%"), Mn(r, "position", "absolute"), Mn(r, "width", "100%"), Mn(r, "zIndex", 1), r), n ? {} : {
    backgroundColor: u.neutral0,
    borderRadius: s,
    boxShadow: "0 0 0 1px hsla(0, 0%, 0%, 0.1), 0 4px 11px hsla(0, 0%, 0%, 0.1)",
    marginBottom: c.menuGutter,
    marginTop: c.menuGutter
  });
}, Nf = /* @__PURE__ */ dd(null), e0 = function(t) {
  var n = t.children, r = t.minMenuHeight, a = t.maxMenuHeight, i = t.menuPlacement, s = t.menuPosition, c = t.menuShouldScrollIntoView, u = t.theme, p = Un(Nf) || {}, g = p.setPortalPlacement, v = _e(null), y = V(a), E = Vn(y, 2), L = E[0], x = E[1], C = V(null), T = Vn(C, 2), D = T[0], k = T[1], N = u.spacing.controlHeight;
  return Js(function() {
    var R = v.current;
    if (R) {
      var A = s === "fixed", f = c && !A, _ = Qx({
        maxHeight: a,
        menuEl: R,
        minHeight: r,
        placement: i,
        shouldScroll: f,
        isFixedPosition: A,
        controlHeight: N
      });
      x(_.maxHeight), k(_.placement), g == null || g(_.placement);
    }
  }, [a, i, s, c, r, g, N]), n({
    ref: v,
    placerProps: qe(qe({}, t), {}, {
      placement: D || Pf(i),
      maxHeight: L
    })
  });
}, t0 = function(t) {
  var n = t.children, r = t.innerRef, a = t.innerProps;
  return je("div", Z({}, Ut(t, "menu", {
    menu: !0
  }), {
    ref: r
  }, a), n);
}, n0 = t0, r0 = function(t, n) {
  var r = t.maxHeight, a = t.theme.spacing.baseUnit;
  return qe({
    maxHeight: r,
    overflowY: "auto",
    position: "relative",
    // required for offset[Height, Top] > keyboard scroll
    WebkitOverflowScrolling: "touch"
  }, n ? {} : {
    paddingBottom: a,
    paddingTop: a
  });
}, a0 = function(t) {
  var n = t.children, r = t.innerProps, a = t.innerRef, i = t.isMulti;
  return je("div", Z({}, Ut(t, "menuList", {
    "menu-list": !0,
    "menu-list--is-multi": i
  }), {
    ref: a
  }, r), n);
}, Rf = function(t, n) {
  var r = t.theme, a = r.spacing.baseUnit, i = r.colors;
  return qe({
    textAlign: "center"
  }, n ? {} : {
    color: i.neutral40,
    padding: "".concat(a * 2, "px ").concat(a * 3, "px")
  });
}, i0 = Rf, o0 = Rf, s0 = function(t) {
  var n = t.children, r = n === void 0 ? "No options" : n, a = t.innerProps, i = Jt(t, Kx);
  return je("div", Z({}, Ut(qe(qe({}, i), {}, {
    children: r,
    innerProps: a
  }), "noOptionsMessage", {
    "menu-notice": !0,
    "menu-notice--no-options": !0
  }), a), r);
}, l0 = function(t) {
  var n = t.children, r = n === void 0 ? "Loading..." : n, a = t.innerProps, i = Jt(t, Jx);
  return je("div", Z({}, Ut(qe(qe({}, i), {}, {
    children: r,
    innerProps: a
  }), "loadingMessage", {
    "menu-notice": !0,
    "menu-notice--loading": !0
  }), a), r);
}, c0 = function(t) {
  var n = t.rect, r = t.offset, a = t.position;
  return {
    left: n.left,
    position: a,
    top: r,
    width: n.width,
    zIndex: 1
  };
}, u0 = function(t) {
  var n = t.appendTo, r = t.children, a = t.controlElement, i = t.innerProps, s = t.menuPlacement, c = t.menuPosition, u = _e(null), p = _e(null), g = V(Pf(s)), v = Vn(g, 2), y = v[0], E = v[1], L = rn(function() {
    return {
      setPortalPlacement: E
    };
  }, []), x = V(null), C = Vn(x, 2), T = C[0], D = C[1], k = vt(function() {
    if (a) {
      var f = Bx(a), _ = c === "fixed" ? 0 : window.pageYOffset, O = f[y] + _;
      (O !== (T == null ? void 0 : T.offset) || f.left !== (T == null ? void 0 : T.rect.left) || f.width !== (T == null ? void 0 : T.rect.width)) && D({
        offset: O,
        rect: f
      });
    }
  }, [a, c, y, T == null ? void 0 : T.offset, T == null ? void 0 : T.rect.left, T == null ? void 0 : T.rect.width]);
  Js(function() {
    k();
  }, [k]);
  var N = vt(function() {
    typeof p.current == "function" && (p.current(), p.current = null), a && u.current && (p.current = Mx(a, u.current, k, {
      elementResize: "ResizeObserver" in window
    }));
  }, [a, k]);
  Js(function() {
    N();
  }, [N]);
  var R = vt(function(f) {
    u.current = f, N();
  }, [N]);
  if (!n && c !== "fixed" || !T) return null;
  var A = je("div", Z({
    ref: R
  }, Ut(qe(qe({}, t), {}, {
    offset: T.offset,
    position: c,
    rect: T.rect
  }), "menuPortal", {
    "menu-portal": !0
  }), i), r);
  return je(Nf.Provider, {
    value: L
  }, n ? /* @__PURE__ */ gm(A, n) : A);
}, d0 = function(t) {
  var n = t.isDisabled, r = t.isRtl;
  return {
    label: "container",
    direction: r ? "rtl" : void 0,
    pointerEvents: n ? "none" : void 0,
    // cancel mouse events when disabled
    position: "relative"
  };
}, f0 = function(t) {
  var n = t.children, r = t.innerProps, a = t.isDisabled, i = t.isRtl;
  return je("div", Z({}, Ut(t, "container", {
    "--is-disabled": a,
    "--is-rtl": i
  }), r), n);
}, p0 = function(t, n) {
  var r = t.theme.spacing, a = t.isMulti, i = t.hasValue, s = t.selectProps.controlShouldRenderValue;
  return qe({
    alignItems: "center",
    display: a && i && s ? "flex" : "grid",
    flex: 1,
    flexWrap: "wrap",
    WebkitOverflowScrolling: "touch",
    position: "relative",
    overflow: "hidden"
  }, n ? {} : {
    padding: "".concat(r.baseUnit / 2, "px ").concat(r.baseUnit * 2, "px")
  });
}, m0 = function(t) {
  var n = t.children, r = t.innerProps, a = t.isMulti, i = t.hasValue;
  return je("div", Z({}, Ut(t, "valueContainer", {
    "value-container": !0,
    "value-container--is-multi": a,
    "value-container--has-value": i
  }), r), n);
}, g0 = function() {
  return {
    alignItems: "center",
    alignSelf: "stretch",
    display: "flex",
    flexShrink: 0
  };
}, h0 = function(t) {
  var n = t.children, r = t.innerProps;
  return je("div", Z({}, Ut(t, "indicatorsContainer", {
    indicators: !0
  }), r), n);
}, ru, v0 = ["size"], y0 = ["innerProps", "isRtl", "size"], b0 = {
  name: "8mmkcg",
  styles: "display:inline-block;fill:currentColor;line-height:1;stroke:currentColor;stroke-width:0"
}, If = function(t) {
  var n = t.size, r = Jt(t, v0);
  return je("svg", Z({
    height: n,
    width: n,
    viewBox: "0 0 20 20",
    "aria-hidden": "true",
    focusable: "false",
    css: b0
  }, r));
}, Bl = function(t) {
  return je(If, Z({
    size: 20
  }, t), je("path", {
    d: "M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"
  }));
}, Af = function(t) {
  return je(If, Z({
    size: 20
  }, t), je("path", {
    d: "M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"
  }));
}, Of = function(t, n) {
  var r = t.isFocused, a = t.theme, i = a.spacing.baseUnit, s = a.colors;
  return qe({
    label: "indicatorContainer",
    display: "flex",
    transition: "color 150ms"
  }, n ? {} : {
    color: r ? s.neutral60 : s.neutral20,
    padding: i * 2,
    ":hover": {
      color: r ? s.neutral80 : s.neutral40
    }
  });
}, w0 = Of, x0 = function(t) {
  var n = t.children, r = t.innerProps;
  return je("div", Z({}, Ut(t, "dropdownIndicator", {
    indicator: !0,
    "dropdown-indicator": !0
  }), r), n || je(Af, null));
}, E0 = Of, L0 = function(t) {
  var n = t.children, r = t.innerProps;
  return je("div", Z({}, Ut(t, "clearIndicator", {
    indicator: !0,
    "clear-indicator": !0
  }), r), n || je(Bl, null));
}, C0 = function(t, n) {
  var r = t.isDisabled, a = t.theme, i = a.spacing.baseUnit, s = a.colors;
  return qe({
    label: "indicatorSeparator",
    alignSelf: "stretch",
    width: 1
  }, n ? {} : {
    backgroundColor: r ? s.neutral10 : s.neutral20,
    marginBottom: i * 2,
    marginTop: i * 2
  });
}, S0 = function(t) {
  var n = t.innerProps;
  return je("span", Z({}, n, Ut(t, "indicatorSeparator", {
    "indicator-separator": !0
  })));
}, T0 = xx(ru || (ru = Ex([`
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
`]))), D0 = function(t, n) {
  var r = t.isFocused, a = t.size, i = t.theme, s = i.colors, c = i.spacing.baseUnit;
  return qe({
    label: "loadingIndicator",
    display: "flex",
    transition: "color 150ms",
    alignSelf: "center",
    fontSize: a,
    lineHeight: 1,
    marginRight: a,
    textAlign: "center",
    verticalAlign: "middle"
  }, n ? {} : {
    color: r ? s.neutral60 : s.neutral20,
    padding: c * 2
  });
}, ns = function(t) {
  var n = t.delay, r = t.offset;
  return je("span", {
    css: /* @__PURE__ */ _l({
      animation: "".concat(T0, " 1s ease-in-out ").concat(n, "ms infinite;"),
      backgroundColor: "currentColor",
      borderRadius: "1em",
      display: "inline-block",
      marginLeft: r ? "1em" : void 0,
      height: "1em",
      verticalAlign: "top",
      width: "1em"
    }, "", "")
  });
}, k0 = function(t) {
  var n = t.innerProps, r = t.isRtl, a = t.size, i = a === void 0 ? 4 : a, s = Jt(t, y0);
  return je("div", Z({}, Ut(qe(qe({}, s), {}, {
    innerProps: n,
    isRtl: r,
    size: i
  }), "loadingIndicator", {
    indicator: !0,
    "loading-indicator": !0
  }), n), je(ns, {
    delay: 0,
    offset: r
  }), je(ns, {
    delay: 160,
    offset: !0
  }), je(ns, {
    delay: 320,
    offset: !r
  }));
}, P0 = function(t, n) {
  var r = t.isDisabled, a = t.isFocused, i = t.theme, s = i.colors, c = i.borderRadius, u = i.spacing;
  return qe({
    label: "control",
    alignItems: "center",
    cursor: "default",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    minHeight: u.controlHeight,
    outline: "0 !important",
    position: "relative",
    transition: "all 100ms"
  }, n ? {} : {
    backgroundColor: r ? s.neutral5 : s.neutral0,
    borderColor: r ? s.neutral10 : a ? s.primary : s.neutral20,
    borderRadius: c,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: a ? "0 0 0 1px ".concat(s.primary) : void 0,
    "&:hover": {
      borderColor: a ? s.primary : s.neutral30
    }
  });
}, N0 = function(t) {
  var n = t.children, r = t.isDisabled, a = t.isFocused, i = t.innerRef, s = t.innerProps, c = t.menuIsOpen;
  return je("div", Z({
    ref: i
  }, Ut(t, "control", {
    control: !0,
    "control--is-disabled": r,
    "control--is-focused": a,
    "control--menu-is-open": c
  }), s, {
    "aria-disabled": r || void 0
  }), n);
}, R0 = N0, I0 = ["data"], A0 = function(t, n) {
  var r = t.theme.spacing;
  return n ? {} : {
    paddingBottom: r.baseUnit * 2,
    paddingTop: r.baseUnit * 2
  };
}, O0 = function(t) {
  var n = t.children, r = t.cx, a = t.getStyles, i = t.getClassNames, s = t.Heading, c = t.headingProps, u = t.innerProps, p = t.label, g = t.theme, v = t.selectProps;
  return je("div", Z({}, Ut(t, "group", {
    group: !0
  }), u), je(s, Z({}, c, {
    selectProps: v,
    theme: g,
    getStyles: a,
    getClassNames: i,
    cx: r
  }), p), je("div", null, n));
}, M0 = function(t, n) {
  var r = t.theme, a = r.colors, i = r.spacing;
  return qe({
    label: "group",
    cursor: "default",
    display: "block"
  }, n ? {} : {
    color: a.neutral40,
    fontSize: "75%",
    fontWeight: 500,
    marginBottom: "0.25em",
    paddingLeft: i.baseUnit * 3,
    paddingRight: i.baseUnit * 3,
    textTransform: "uppercase"
  });
}, $0 = function(t) {
  var n = Tf(t);
  n.data;
  var r = Jt(n, I0);
  return je("div", Z({}, Ut(t, "groupHeading", {
    "group-heading": !0
  }), r));
}, F0 = O0, _0 = ["innerRef", "isDisabled", "isHidden", "inputClassName"], j0 = function(t, n) {
  var r = t.isDisabled, a = t.value, i = t.theme, s = i.spacing, c = i.colors;
  return qe(qe({
    visibility: r ? "hidden" : "visible",
    // force css to recompute when value change due to @emotion bug.
    // We can remove it whenever the bug is fixed.
    transform: a ? "translateZ(0)" : ""
  }, V0), n ? {} : {
    margin: s.baseUnit / 2,
    paddingBottom: s.baseUnit / 2,
    paddingTop: s.baseUnit / 2,
    color: c.neutral80
  });
}, Mf = {
  gridArea: "1 / 2",
  font: "inherit",
  minWidth: "2px",
  border: 0,
  margin: 0,
  outline: 0,
  padding: 0
}, V0 = {
  flex: "1 1 auto",
  display: "inline-grid",
  gridArea: "1 / 1 / 2 / 3",
  gridTemplateColumns: "0 min-content",
  "&:after": qe({
    content: 'attr(data-value) " "',
    visibility: "hidden",
    whiteSpace: "pre"
  }, Mf)
}, U0 = function(t) {
  return qe({
    label: "input",
    color: "inherit",
    background: 0,
    opacity: t ? 0 : 1,
    width: "100%"
  }, Mf);
}, B0 = function(t) {
  var n = t.cx, r = t.value, a = Tf(t), i = a.innerRef, s = a.isDisabled, c = a.isHidden, u = a.inputClassName, p = Jt(a, _0);
  return je("div", Z({}, Ut(t, "input", {
    "input-container": !0
  }), {
    "data-value": r || ""
  }), je("input", Z({
    className: n({
      input: !0
    }, u),
    ref: i,
    style: U0(c),
    disabled: s
  }, p)));
}, H0 = B0, z0 = function(t, n) {
  var r = t.theme, a = r.spacing, i = r.borderRadius, s = r.colors;
  return qe({
    label: "multiValue",
    display: "flex",
    minWidth: 0
  }, n ? {} : {
    backgroundColor: s.neutral10,
    borderRadius: i / 2,
    margin: a.baseUnit / 2
  });
}, q0 = function(t, n) {
  var r = t.theme, a = r.borderRadius, i = r.colors, s = t.cropWithEllipsis;
  return qe({
    overflow: "hidden",
    textOverflow: s || s === void 0 ? "ellipsis" : void 0,
    whiteSpace: "nowrap"
  }, n ? {} : {
    borderRadius: a / 2,
    color: i.neutral80,
    fontSize: "85%",
    padding: 3,
    paddingLeft: 6
  });
}, W0 = function(t, n) {
  var r = t.theme, a = r.spacing, i = r.borderRadius, s = r.colors, c = t.isFocused;
  return qe({
    alignItems: "center",
    display: "flex"
  }, n ? {} : {
    borderRadius: i / 2,
    backgroundColor: c ? s.dangerLight : void 0,
    paddingLeft: a.baseUnit,
    paddingRight: a.baseUnit,
    ":hover": {
      backgroundColor: s.dangerLight,
      color: s.danger
    }
  });
}, $f = function(t) {
  var n = t.children, r = t.innerProps;
  return je("div", r, n);
}, Y0 = $f, G0 = $f;
function K0(e) {
  var t = e.children, n = e.innerProps;
  return je("div", Z({
    role: "button"
  }, n), t || je(Bl, {
    size: 14
  }));
}
var J0 = function(t) {
  var n = t.children, r = t.components, a = t.data, i = t.innerProps, s = t.isDisabled, c = t.removeProps, u = t.selectProps, p = r.Container, g = r.Label, v = r.Remove;
  return je(p, {
    data: a,
    innerProps: qe(qe({}, Ut(t, "multiValue", {
      "multi-value": !0,
      "multi-value--is-disabled": s
    })), i),
    selectProps: u
  }, je(g, {
    data: a,
    innerProps: qe({}, Ut(t, "multiValueLabel", {
      "multi-value__label": !0
    })),
    selectProps: u
  }, n), je(v, {
    data: a,
    innerProps: qe(qe({}, Ut(t, "multiValueRemove", {
      "multi-value__remove": !0
    })), {}, {
      "aria-label": "Remove ".concat(n || "option")
    }, c),
    selectProps: u
  }));
}, Q0 = J0, X0 = function(t, n) {
  var r = t.isDisabled, a = t.isFocused, i = t.isSelected, s = t.theme, c = s.spacing, u = s.colors;
  return qe({
    label: "option",
    cursor: "default",
    display: "block",
    fontSize: "inherit",
    width: "100%",
    userSelect: "none",
    WebkitTapHighlightColor: "rgba(0, 0, 0, 0)"
  }, n ? {} : {
    backgroundColor: i ? u.primary : a ? u.primary25 : "transparent",
    color: r ? u.neutral20 : i ? u.neutral0 : "inherit",
    padding: "".concat(c.baseUnit * 2, "px ").concat(c.baseUnit * 3, "px"),
    // provide some affordance on touch devices
    ":active": {
      backgroundColor: r ? void 0 : i ? u.primary : u.primary50
    }
  });
}, Z0 = function(t) {
  var n = t.children, r = t.isDisabled, a = t.isFocused, i = t.isSelected, s = t.innerRef, c = t.innerProps;
  return je("div", Z({}, Ut(t, "option", {
    option: !0,
    "option--is-disabled": r,
    "option--is-focused": a,
    "option--is-selected": i
  }), {
    ref: s,
    "aria-disabled": r
  }, c), n);
}, eE = Z0, tE = function(t, n) {
  var r = t.theme, a = r.spacing, i = r.colors;
  return qe({
    label: "placeholder",
    gridArea: "1 / 1 / 2 / 3"
  }, n ? {} : {
    color: i.neutral50,
    marginLeft: a.baseUnit / 2,
    marginRight: a.baseUnit / 2
  });
}, nE = function(t) {
  var n = t.children, r = t.innerProps;
  return je("div", Z({}, Ut(t, "placeholder", {
    placeholder: !0
  }), r), n);
}, rE = nE, aE = function(t, n) {
  var r = t.isDisabled, a = t.theme, i = a.spacing, s = a.colors;
  return qe({
    label: "singleValue",
    gridArea: "1 / 1 / 2 / 3",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  }, n ? {} : {
    color: r ? s.neutral40 : s.neutral80,
    marginLeft: i.baseUnit / 2,
    marginRight: i.baseUnit / 2
  });
}, iE = function(t) {
  var n = t.children, r = t.isDisabled, a = t.innerProps;
  return je("div", Z({}, Ut(t, "singleValue", {
    "single-value": !0,
    "single-value--is-disabled": r
  }), a), n);
}, oE = iE, Ff = {
  ClearIndicator: L0,
  Control: R0,
  DropdownIndicator: x0,
  DownChevron: Af,
  CrossIcon: Bl,
  Group: F0,
  GroupHeading: $0,
  IndicatorsContainer: h0,
  IndicatorSeparator: S0,
  Input: H0,
  LoadingIndicator: k0,
  Menu: n0,
  MenuList: a0,
  MenuPortal: u0,
  LoadingMessage: l0,
  NoOptionsMessage: s0,
  MultiValue: Q0,
  MultiValueContainer: Y0,
  MultiValueLabel: G0,
  MultiValueRemove: K0,
  Option: eE,
  Placeholder: rE,
  SelectContainer: f0,
  SingleValue: oE,
  ValueContainer: m0
}, sE = function(t) {
  return qe(qe({}, Ff), t.components);
}, au = Number.isNaN || function(t) {
  return typeof t == "number" && t !== t;
};
function lE(e, t) {
  return !!(e === t || au(e) && au(t));
}
function cE(e, t) {
  if (e.length !== t.length)
    return !1;
  for (var n = 0; n < e.length; n++)
    if (!lE(e[n], t[n]))
      return !1;
  return !0;
}
function uE(e, t) {
  t === void 0 && (t = cE);
  var n = null;
  function r() {
    for (var a = [], i = 0; i < arguments.length; i++)
      a[i] = arguments[i];
    if (n && n.lastThis === this && t(a, n.lastArgs))
      return n.lastResult;
    var s = e.apply(this, a);
    return n = {
      lastResult: s,
      lastArgs: a,
      lastThis: this
    }, s;
  }
  return r.clear = function() {
    n = null;
  }, r;
}
var dE = {
  name: "7pg0cj-a11yText",
  styles: "label:a11yText;z-index:9999;border:0;clip:rect(1px, 1px, 1px, 1px);height:1px;width:1px;position:absolute;overflow:hidden;padding:0;white-space:nowrap"
}, fE = function(t) {
  return je("span", Z({
    css: dE
  }, t));
}, iu = fE, pE = {
  guidance: function(t) {
    var n = t.isSearchable, r = t.isMulti, a = t.tabSelectsValue, i = t.context, s = t.isInitialFocus;
    switch (i) {
      case "menu":
        return "Use Up and Down to choose options, press Enter to select the currently focused option, press Escape to exit the menu".concat(a ? ", press Tab to select the option and exit the menu" : "", ".");
      case "input":
        return s ? "".concat(t["aria-label"] || "Select", " is focused ").concat(n ? ",type to refine list" : "", ", press Down to open the menu, ").concat(r ? " press left to focus selected values" : "") : "";
      case "value":
        return "Use left and right to toggle between focused values, press Backspace to remove the currently focused value";
      default:
        return "";
    }
  },
  onChange: function(t) {
    var n = t.action, r = t.label, a = r === void 0 ? "" : r, i = t.labels, s = t.isDisabled;
    switch (n) {
      case "deselect-option":
      case "pop-value":
      case "remove-value":
        return "option ".concat(a, ", deselected.");
      case "clear":
        return "All selected options have been cleared.";
      case "initial-input-focus":
        return "option".concat(i.length > 1 ? "s" : "", " ").concat(i.join(","), ", selected.");
      case "select-option":
        return s ? "option ".concat(a, " is disabled. Select another option.") : "option ".concat(a, ", selected.");
      default:
        return "";
    }
  },
  onFocus: function(t) {
    var n = t.context, r = t.focused, a = t.options, i = t.label, s = i === void 0 ? "" : i, c = t.selectValue, u = t.isDisabled, p = t.isSelected, g = t.isAppleDevice, v = function(x, C) {
      return x && x.length ? "".concat(x.indexOf(C) + 1, " of ").concat(x.length) : "";
    };
    if (n === "value" && c)
      return "value ".concat(s, " focused, ").concat(v(c, r), ".");
    if (n === "menu" && g) {
      var y = u ? " disabled" : "", E = "".concat(p ? " selected" : "").concat(y);
      return "".concat(s).concat(E, ", ").concat(v(a, r), ".");
    }
    return "";
  },
  onFilter: function(t) {
    var n = t.inputValue, r = t.resultsMessage;
    return "".concat(r).concat(n ? " for search term " + n : "", ".");
  }
}, mE = function(t) {
  var n = t.ariaSelection, r = t.focusedOption, a = t.focusedValue, i = t.focusableOptions, s = t.isFocused, c = t.selectValue, u = t.selectProps, p = t.id, g = t.isAppleDevice, v = u.ariaLiveMessages, y = u.getOptionLabel, E = u.inputValue, L = u.isMulti, x = u.isOptionDisabled, C = u.isSearchable, T = u.menuIsOpen, D = u.options, k = u.screenReaderStatus, N = u.tabSelectsValue, R = u.isLoading, A = u["aria-label"], f = u["aria-live"], _ = rn(function() {
    return qe(qe({}, pE), v || {});
  }, [v]), O = rn(function() {
    var be = "";
    if (n && _.onChange) {
      var $e = n.option, Se = n.options, xe = n.removedValue, Te = n.removedValues, We = n.value, Oe = function(yt) {
        return Array.isArray(yt) ? null : yt;
      }, Ne = xe || $e || Oe(We), Me = Ne ? y(Ne) : "", Ze = Se || Te || void 0, at = Ze ? Ze.map(y) : [], He = qe({
        // multiSelected items are usually items that have already been selected
        // or set by the user as a default value so we assume they are not disabled
        isDisabled: Ne && x(Ne, c),
        label: Me,
        labels: at
      }, n);
      be = _.onChange(He);
    }
    return be;
  }, [n, _, x, c, y]), J = rn(function() {
    var be = "", $e = r || a, Se = !!(r && c && c.includes(r));
    if ($e && _.onFocus) {
      var xe = {
        focused: $e,
        label: y($e),
        isDisabled: x($e, c),
        isSelected: Se,
        options: i,
        context: $e === r ? "menu" : "value",
        selectValue: c,
        isAppleDevice: g
      };
      be = _.onFocus(xe);
    }
    return be;
  }, [r, a, y, x, _, i, c, g]), ee = rn(function() {
    var be = "";
    if (T && D.length && !R && _.onFilter) {
      var $e = k({
        count: i.length
      });
      be = _.onFilter({
        inputValue: E,
        resultsMessage: $e
      });
    }
    return be;
  }, [i, E, T, _, D, k, R]), ge = (n == null ? void 0 : n.action) === "initial-input-focus", ie = rn(function() {
    var be = "";
    if (_.guidance) {
      var $e = a ? "value" : T ? "menu" : "input";
      be = _.guidance({
        "aria-label": A,
        context: $e,
        isDisabled: r && x(r, c),
        isMulti: L,
        isSearchable: C,
        tabSelectsValue: N,
        isInitialFocus: ge
      });
    }
    return be;
  }, [A, r, a, L, x, C, T, _, c, N, ge]), fe = je(Ni, null, je("span", {
    id: "aria-selection"
  }, O), je("span", {
    id: "aria-focused"
  }, J), je("span", {
    id: "aria-results"
  }, ee), je("span", {
    id: "aria-guidance"
  }, ie));
  return je(Ni, null, je(iu, {
    id: p
  }, ge && fe), je(iu, {
    "aria-live": f,
    "aria-atomic": "false",
    "aria-relevant": "additions text",
    role: "log"
  }, s && !ge && fe));
}, gE = mE, Qs = [{
  base: "A",
  letters: "AⒶＡÀÁÂẦẤẪẨÃĀĂẰẮẴẲȦǠÄǞẢÅǺǍȀȂẠẬẶḀĄȺⱯ"
}, {
  base: "AA",
  letters: "Ꜳ"
}, {
  base: "AE",
  letters: "ÆǼǢ"
}, {
  base: "AO",
  letters: "Ꜵ"
}, {
  base: "AU",
  letters: "Ꜷ"
}, {
  base: "AV",
  letters: "ꜸꜺ"
}, {
  base: "AY",
  letters: "Ꜽ"
}, {
  base: "B",
  letters: "BⒷＢḂḄḆɃƂƁ"
}, {
  base: "C",
  letters: "CⒸＣĆĈĊČÇḈƇȻꜾ"
}, {
  base: "D",
  letters: "DⒹＤḊĎḌḐḒḎĐƋƊƉꝹ"
}, {
  base: "DZ",
  letters: "ǱǄ"
}, {
  base: "Dz",
  letters: "ǲǅ"
}, {
  base: "E",
  letters: "EⒺＥÈÉÊỀẾỄỂẼĒḔḖĔĖËẺĚȄȆẸỆȨḜĘḘḚƐƎ"
}, {
  base: "F",
  letters: "FⒻＦḞƑꝻ"
}, {
  base: "G",
  letters: "GⒼＧǴĜḠĞĠǦĢǤƓꞠꝽꝾ"
}, {
  base: "H",
  letters: "HⒽＨĤḢḦȞḤḨḪĦⱧⱵꞍ"
}, {
  base: "I",
  letters: "IⒾＩÌÍÎĨĪĬİÏḮỈǏȈȊỊĮḬƗ"
}, {
  base: "J",
  letters: "JⒿＪĴɈ"
}, {
  base: "K",
  letters: "KⓀＫḰǨḲĶḴƘⱩꝀꝂꝄꞢ"
}, {
  base: "L",
  letters: "LⓁＬĿĹĽḶḸĻḼḺŁȽⱢⱠꝈꝆꞀ"
}, {
  base: "LJ",
  letters: "Ǉ"
}, {
  base: "Lj",
  letters: "ǈ"
}, {
  base: "M",
  letters: "MⓂＭḾṀṂⱮƜ"
}, {
  base: "N",
  letters: "NⓃＮǸŃÑṄŇṆŅṊṈȠƝꞐꞤ"
}, {
  base: "NJ",
  letters: "Ǌ"
}, {
  base: "Nj",
  letters: "ǋ"
}, {
  base: "O",
  letters: "OⓄＯÒÓÔỒỐỖỔÕṌȬṎŌṐṒŎȮȰÖȪỎŐǑȌȎƠỜỚỠỞỢỌỘǪǬØǾƆƟꝊꝌ"
}, {
  base: "OI",
  letters: "Ƣ"
}, {
  base: "OO",
  letters: "Ꝏ"
}, {
  base: "OU",
  letters: "Ȣ"
}, {
  base: "P",
  letters: "PⓅＰṔṖƤⱣꝐꝒꝔ"
}, {
  base: "Q",
  letters: "QⓆＱꝖꝘɊ"
}, {
  base: "R",
  letters: "RⓇＲŔṘŘȐȒṚṜŖṞɌⱤꝚꞦꞂ"
}, {
  base: "S",
  letters: "SⓈＳẞŚṤŜṠŠṦṢṨȘŞⱾꞨꞄ"
}, {
  base: "T",
  letters: "TⓉＴṪŤṬȚŢṰṮŦƬƮȾꞆ"
}, {
  base: "TZ",
  letters: "Ꜩ"
}, {
  base: "U",
  letters: "UⓊＵÙÚÛŨṸŪṺŬÜǛǗǕǙỦŮŰǓȔȖƯỪỨỮỬỰỤṲŲṶṴɄ"
}, {
  base: "V",
  letters: "VⓋＶṼṾƲꝞɅ"
}, {
  base: "VY",
  letters: "Ꝡ"
}, {
  base: "W",
  letters: "WⓌＷẀẂŴẆẄẈⱲ"
}, {
  base: "X",
  letters: "XⓍＸẊẌ"
}, {
  base: "Y",
  letters: "YⓎＹỲÝŶỸȲẎŸỶỴƳɎỾ"
}, {
  base: "Z",
  letters: "ZⓏＺŹẐŻŽẒẔƵȤⱿⱫꝢ"
}, {
  base: "a",
  letters: "aⓐａẚàáâầấẫẩãāăằắẵẳȧǡäǟảåǻǎȁȃạậặḁąⱥɐ"
}, {
  base: "aa",
  letters: "ꜳ"
}, {
  base: "ae",
  letters: "æǽǣ"
}, {
  base: "ao",
  letters: "ꜵ"
}, {
  base: "au",
  letters: "ꜷ"
}, {
  base: "av",
  letters: "ꜹꜻ"
}, {
  base: "ay",
  letters: "ꜽ"
}, {
  base: "b",
  letters: "bⓑｂḃḅḇƀƃɓ"
}, {
  base: "c",
  letters: "cⓒｃćĉċčçḉƈȼꜿↄ"
}, {
  base: "d",
  letters: "dⓓｄḋďḍḑḓḏđƌɖɗꝺ"
}, {
  base: "dz",
  letters: "ǳǆ"
}, {
  base: "e",
  letters: "eⓔｅèéêềếễểẽēḕḗĕėëẻěȅȇẹệȩḝęḙḛɇɛǝ"
}, {
  base: "f",
  letters: "fⓕｆḟƒꝼ"
}, {
  base: "g",
  letters: "gⓖｇǵĝḡğġǧģǥɠꞡᵹꝿ"
}, {
  base: "h",
  letters: "hⓗｈĥḣḧȟḥḩḫẖħⱨⱶɥ"
}, {
  base: "hv",
  letters: "ƕ"
}, {
  base: "i",
  letters: "iⓘｉìíîĩīĭïḯỉǐȉȋịįḭɨı"
}, {
  base: "j",
  letters: "jⓙｊĵǰɉ"
}, {
  base: "k",
  letters: "kⓚｋḱǩḳķḵƙⱪꝁꝃꝅꞣ"
}, {
  base: "l",
  letters: "lⓛｌŀĺľḷḹļḽḻſłƚɫⱡꝉꞁꝇ"
}, {
  base: "lj",
  letters: "ǉ"
}, {
  base: "m",
  letters: "mⓜｍḿṁṃɱɯ"
}, {
  base: "n",
  letters: "nⓝｎǹńñṅňṇņṋṉƞɲŉꞑꞥ"
}, {
  base: "nj",
  letters: "ǌ"
}, {
  base: "o",
  letters: "oⓞｏòóôồốỗổõṍȭṏōṑṓŏȯȱöȫỏőǒȍȏơờớỡởợọộǫǭøǿɔꝋꝍɵ"
}, {
  base: "oi",
  letters: "ƣ"
}, {
  base: "ou",
  letters: "ȣ"
}, {
  base: "oo",
  letters: "ꝏ"
}, {
  base: "p",
  letters: "pⓟｐṕṗƥᵽꝑꝓꝕ"
}, {
  base: "q",
  letters: "qⓠｑɋꝗꝙ"
}, {
  base: "r",
  letters: "rⓡｒŕṙřȑȓṛṝŗṟɍɽꝛꞧꞃ"
}, {
  base: "s",
  letters: "sⓢｓßśṥŝṡšṧṣṩșşȿꞩꞅẛ"
}, {
  base: "t",
  letters: "tⓣｔṫẗťṭțţṱṯŧƭʈⱦꞇ"
}, {
  base: "tz",
  letters: "ꜩ"
}, {
  base: "u",
  letters: "uⓤｕùúûũṹūṻŭüǜǘǖǚủůűǔȕȗưừứữửựụṳųṷṵʉ"
}, {
  base: "v",
  letters: "vⓥｖṽṿʋꝟʌ"
}, {
  base: "vy",
  letters: "ꝡ"
}, {
  base: "w",
  letters: "wⓦｗẁẃŵẇẅẘẉⱳ"
}, {
  base: "x",
  letters: "xⓧｘẋẍ"
}, {
  base: "y",
  letters: "yⓨｙỳýŷỹȳẏÿỷẙỵƴɏỿ"
}, {
  base: "z",
  letters: "zⓩｚźẑżžẓẕƶȥɀⱬꝣ"
}], hE = new RegExp("[" + Qs.map(function(e) {
  return e.letters;
}).join("") + "]", "g"), _f = {};
for (var rs = 0; rs < Qs.length; rs++)
  for (var as = Qs[rs], is = 0; is < as.letters.length; is++)
    _f[as.letters[is]] = as.base;
var jf = function(t) {
  return t.replace(hE, function(n) {
    return _f[n];
  });
}, vE = uE(jf), ou = function(t) {
  return t.replace(/^\s+|\s+$/g, "");
}, yE = function(t) {
  return "".concat(t.label, " ").concat(t.value);
}, bE = function(t) {
  return function(n, r) {
    if (n.data.__isNew__) return !0;
    var a = qe({
      ignoreCase: !0,
      ignoreAccents: !0,
      stringify: yE,
      trim: !0,
      matchFrom: "any"
    }, t), i = a.ignoreCase, s = a.ignoreAccents, c = a.stringify, u = a.trim, p = a.matchFrom, g = u ? ou(r) : r, v = u ? ou(c(n)) : c(n);
    return i && (g = g.toLowerCase(), v = v.toLowerCase()), s && (g = vE(g), v = jf(v)), p === "start" ? v.substr(0, g.length) === g : v.indexOf(g) > -1;
  };
}, wE = ["innerRef"];
function xE(e) {
  var t = e.innerRef, n = Jt(e, wE), r = Gx(n, "onExited", "in", "enter", "exit", "appear");
  return je("input", Z({
    ref: t
  }, r, {
    css: /* @__PURE__ */ _l({
      label: "dummyInput",
      // get rid of any default styles
      background: 0,
      border: 0,
      // important! this hides the flashing cursor
      caretColor: "transparent",
      fontSize: "inherit",
      gridArea: "1 / 1 / 2 / 3",
      outline: 0,
      padding: 0,
      // important! without `width` browsers won't allow focus
      width: 1,
      // remove cursor on desktop
      color: "transparent",
      // remove cursor on mobile whilst maintaining "scroll into view" behaviour
      left: -100,
      opacity: 0,
      position: "relative",
      transform: "scale(.01)"
    }, "", "")
  }));
}
var EE = function(t) {
  t.cancelable && t.preventDefault(), t.stopPropagation();
};
function LE(e) {
  var t = e.isEnabled, n = e.onBottomArrive, r = e.onBottomLeave, a = e.onTopArrive, i = e.onTopLeave, s = _e(!1), c = _e(!1), u = _e(0), p = _e(null), g = vt(function(C, T) {
    if (p.current !== null) {
      var D = p.current, k = D.scrollTop, N = D.scrollHeight, R = D.clientHeight, A = p.current, f = T > 0, _ = N - R - k, O = !1;
      _ > T && s.current && (r && r(C), s.current = !1), f && c.current && (i && i(C), c.current = !1), f && T > _ ? (n && !s.current && n(C), A.scrollTop = N, O = !0, s.current = !0) : !f && -T > k && (a && !c.current && a(C), A.scrollTop = 0, O = !0, c.current = !0), O && EE(C);
    }
  }, [n, r, a, i]), v = vt(function(C) {
    g(C, C.deltaY);
  }, [g]), y = vt(function(C) {
    u.current = C.changedTouches[0].clientY;
  }, []), E = vt(function(C) {
    var T = u.current - C.changedTouches[0].clientY;
    g(C, T);
  }, [g]), L = vt(function(C) {
    if (C) {
      var T = qx ? {
        passive: !1
      } : !1;
      C.addEventListener("wheel", v, T), C.addEventListener("touchstart", y, T), C.addEventListener("touchmove", E, T);
    }
  }, [E, y, v]), x = vt(function(C) {
    C && (C.removeEventListener("wheel", v, !1), C.removeEventListener("touchstart", y, !1), C.removeEventListener("touchmove", E, !1));
  }, [E, y, v]);
  return ye(function() {
    if (t) {
      var C = p.current;
      return L(C), function() {
        x(C);
      };
    }
  }, [t, L, x]), function(C) {
    p.current = C;
  };
}
var su = ["boxSizing", "height", "overflow", "paddingRight", "position"], lu = {
  boxSizing: "border-box",
  // account for possible declaration `width: 100%;` on body
  overflow: "hidden",
  position: "relative",
  height: "100%"
};
function cu(e) {
  e.cancelable && e.preventDefault();
}
function uu(e) {
  e.stopPropagation();
}
function du() {
  var e = this.scrollTop, t = this.scrollHeight, n = e + this.offsetHeight;
  e === 0 ? this.scrollTop = 1 : n === t && (this.scrollTop = e - 1);
}
function fu() {
  return "ontouchstart" in window || navigator.maxTouchPoints;
}
var pu = !!(typeof window < "u" && window.document && window.document.createElement), Ia = 0, Zr = {
  capture: !1,
  passive: !1
};
function CE(e) {
  var t = e.isEnabled, n = e.accountForScrollbars, r = n === void 0 ? !0 : n, a = _e({}), i = _e(null), s = vt(function(u) {
    if (pu) {
      var p = document.body, g = p && p.style;
      if (r && su.forEach(function(L) {
        var x = g && g[L];
        a.current[L] = x;
      }), r && Ia < 1) {
        var v = parseInt(a.current.paddingRight, 10) || 0, y = document.body ? document.body.clientWidth : 0, E = window.innerWidth - y + v || 0;
        Object.keys(lu).forEach(function(L) {
          var x = lu[L];
          g && (g[L] = x);
        }), g && (g.paddingRight = "".concat(E, "px"));
      }
      p && fu() && (p.addEventListener("touchmove", cu, Zr), u && (u.addEventListener("touchstart", du, Zr), u.addEventListener("touchmove", uu, Zr))), Ia += 1;
    }
  }, [r]), c = vt(function(u) {
    if (pu) {
      var p = document.body, g = p && p.style;
      Ia = Math.max(Ia - 1, 0), r && Ia < 1 && su.forEach(function(v) {
        var y = a.current[v];
        g && (g[v] = y);
      }), p && fu() && (p.removeEventListener("touchmove", cu, Zr), u && (u.removeEventListener("touchstart", du, Zr), u.removeEventListener("touchmove", uu, Zr)));
    }
  }, [r]);
  return ye(function() {
    if (t) {
      var u = i.current;
      return s(u), function() {
        c(u);
      };
    }
  }, [t, s, c]), function(u) {
    i.current = u;
  };
}
var SE = function(t) {
  var n = t.target;
  return n.ownerDocument.activeElement && n.ownerDocument.activeElement.blur();
}, TE = {
  name: "1kfdb0e",
  styles: "position:fixed;left:0;bottom:0;right:0;top:0"
};
function DE(e) {
  var t = e.children, n = e.lockEnabled, r = e.captureEnabled, a = r === void 0 ? !0 : r, i = e.onBottomArrive, s = e.onBottomLeave, c = e.onTopArrive, u = e.onTopLeave, p = LE({
    isEnabled: a,
    onBottomArrive: i,
    onBottomLeave: s,
    onTopArrive: c,
    onTopLeave: u
  }), g = CE({
    isEnabled: n
  }), v = function(E) {
    p(E), g(E);
  };
  return je(Ni, null, n && je("div", {
    onClick: SE,
    css: TE
  }), t(v));
}
var kE = {
  name: "1a0ro4n-requiredInput",
  styles: "label:requiredInput;opacity:0;pointer-events:none;position:absolute;bottom:0;left:0;right:0;width:100%"
}, PE = function(t) {
  var n = t.name, r = t.onFocus;
  return je("input", {
    required: !0,
    name: n,
    tabIndex: -1,
    "aria-hidden": "true",
    onFocus: r,
    css: kE,
    value: "",
    onChange: function() {
    }
  });
}, NE = PE;
function Hl(e) {
  var t;
  return typeof window < "u" && window.navigator != null ? e.test(((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) || window.navigator.platform) : !1;
}
function RE() {
  return Hl(/^iPhone/i);
}
function Vf() {
  return Hl(/^Mac/i);
}
function IE() {
  return Hl(/^iPad/i) || // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
  Vf() && navigator.maxTouchPoints > 1;
}
function AE() {
  return RE() || IE();
}
function OE() {
  return Vf() || AE();
}
var ME = function(t) {
  return t.label;
}, $E = function(t) {
  return t.label;
}, FE = function(t) {
  return t.value;
}, _E = function(t) {
  return !!t.isDisabled;
}, jE = {
  clearIndicator: E0,
  container: d0,
  control: P0,
  dropdownIndicator: w0,
  group: A0,
  groupHeading: M0,
  indicatorsContainer: g0,
  indicatorSeparator: C0,
  input: j0,
  loadingIndicator: D0,
  loadingMessage: o0,
  menu: Zx,
  menuList: r0,
  menuPortal: c0,
  multiValue: z0,
  multiValueLabel: q0,
  multiValueRemove: W0,
  noOptionsMessage: i0,
  option: X0,
  placeholder: tE,
  singleValue: aE,
  valueContainer: p0
}, VE = {
  primary: "#2684FF",
  primary75: "#4C9AFF",
  primary50: "#B2D4FF",
  primary25: "#DEEBFF",
  danger: "#DE350B",
  dangerLight: "#FFBDAD",
  neutral0: "hsl(0, 0%, 100%)",
  neutral5: "hsl(0, 0%, 95%)",
  neutral10: "hsl(0, 0%, 90%)",
  neutral20: "hsl(0, 0%, 80%)",
  neutral30: "hsl(0, 0%, 70%)",
  neutral40: "hsl(0, 0%, 60%)",
  neutral50: "hsl(0, 0%, 50%)",
  neutral60: "hsl(0, 0%, 40%)",
  neutral70: "hsl(0, 0%, 30%)",
  neutral80: "hsl(0, 0%, 20%)",
  neutral90: "hsl(0, 0%, 10%)"
}, UE = 4, Uf = 4, BE = 38, HE = Uf * 2, zE = {
  baseUnit: Uf,
  controlHeight: BE,
  menuGutter: HE
}, os = {
  borderRadius: UE,
  colors: VE,
  spacing: zE
}, qE = {
  "aria-live": "polite",
  backspaceRemovesValue: !0,
  blurInputOnSelect: nu(),
  captureMenuScroll: !nu(),
  classNames: {},
  closeMenuOnSelect: !0,
  closeMenuOnScroll: !1,
  components: {},
  controlShouldRenderValue: !0,
  escapeClearsValue: !1,
  filterOption: bE(),
  formatGroupLabel: ME,
  getOptionLabel: $E,
  getOptionValue: FE,
  isDisabled: !1,
  isLoading: !1,
  isMulti: !1,
  isRtl: !1,
  isSearchable: !0,
  isOptionDisabled: _E,
  loadingMessage: function() {
    return "Loading...";
  },
  maxMenuHeight: 300,
  minMenuHeight: 140,
  menuIsOpen: !1,
  menuPlacement: "bottom",
  menuPosition: "absolute",
  menuShouldBlockScroll: !1,
  menuShouldScrollIntoView: !Hx(),
  noOptionsMessage: function() {
    return "No options";
  },
  openMenuOnFocus: !1,
  openMenuOnClick: !0,
  options: [],
  pageSize: 5,
  placeholder: "Select...",
  screenReaderStatus: function(t) {
    var n = t.count;
    return "".concat(n, " result").concat(n !== 1 ? "s" : "", " available");
  },
  styles: {},
  tabIndex: 0,
  tabSelectsValue: !0,
  unstyled: !1
};
function mu(e, t, n, r) {
  var a = zf(e, t, n), i = qf(e, t, n), s = Hf(e, t), c = zi(e, t);
  return {
    type: "option",
    data: t,
    isDisabled: a,
    isSelected: i,
    label: s,
    value: c,
    index: r
  };
}
function ki(e, t) {
  return e.options.map(function(n, r) {
    if ("options" in n) {
      var a = n.options.map(function(s, c) {
        return mu(e, s, t, c);
      }).filter(function(s) {
        return hu(e, s);
      });
      return a.length > 0 ? {
        type: "group",
        data: n,
        options: a,
        index: r
      } : void 0;
    }
    var i = mu(e, n, t, r);
    return hu(e, i) ? i : void 0;
  }).filter(Wx);
}
function Bf(e) {
  return e.reduce(function(t, n) {
    return n.type === "group" ? t.push.apply(t, ro(n.options.map(function(r) {
      return r.data;
    }))) : t.push(n.data), t;
  }, []);
}
function gu(e, t) {
  return e.reduce(function(n, r) {
    return r.type === "group" ? n.push.apply(n, ro(r.options.map(function(a) {
      return {
        data: a.data,
        id: "".concat(t, "-").concat(r.index, "-").concat(a.index)
      };
    }))) : n.push({
      data: r.data,
      id: "".concat(t, "-").concat(r.index)
    }), n;
  }, []);
}
function WE(e, t) {
  return Bf(ki(e, t));
}
function hu(e, t) {
  var n = e.inputValue, r = n === void 0 ? "" : n, a = t.data, i = t.isSelected, s = t.label, c = t.value;
  return (!Yf(e) || !i) && Wf(e, {
    label: s,
    value: c,
    data: a
  }, r);
}
function YE(e, t) {
  var n = e.focusedValue, r = e.selectValue, a = r.indexOf(n);
  if (a > -1) {
    var i = t.indexOf(n);
    if (i > -1)
      return n;
    if (a < t.length)
      return t[a];
  }
  return null;
}
function GE(e, t) {
  var n = e.focusedOption;
  return n && t.indexOf(n) > -1 ? n : t[0];
}
var ss = function(t, n) {
  var r, a = (r = t.find(function(i) {
    return i.data === n;
  })) === null || r === void 0 ? void 0 : r.id;
  return a || null;
}, Hf = function(t, n) {
  return t.getOptionLabel(n);
}, zi = function(t, n) {
  return t.getOptionValue(n);
};
function zf(e, t, n) {
  return typeof e.isOptionDisabled == "function" ? e.isOptionDisabled(t, n) : !1;
}
function qf(e, t, n) {
  if (n.indexOf(t) > -1) return !0;
  if (typeof e.isOptionSelected == "function")
    return e.isOptionSelected(t, n);
  var r = zi(e, t);
  return n.some(function(a) {
    return zi(e, a) === r;
  });
}
function Wf(e, t, n) {
  return e.filterOption ? e.filterOption(t, n) : !0;
}
var Yf = function(t) {
  var n = t.hideSelectedOptions, r = t.isMulti;
  return n === void 0 ? r : n;
}, KE = 1, Gf = /* @__PURE__ */ function(e) {
  sw(n, e);
  var t = cw(n);
  function n(r) {
    var a;
    if (ow(this, n), a = t.call(this, r), a.state = {
      ariaSelection: null,
      focusedOption: null,
      focusedOptionId: null,
      focusableOptionsWithIds: [],
      focusedValue: null,
      inputIsHidden: !1,
      isFocused: !1,
      selectValue: [],
      clearFocusValueOnUpdate: !1,
      prevWasFocused: !1,
      inputIsHiddenAfterUpdate: void 0,
      prevProps: void 0,
      instancePrefix: "",
      isAppleDevice: !1
    }, a.blockOptionHover = !1, a.isComposing = !1, a.commonProps = void 0, a.initialTouchX = 0, a.initialTouchY = 0, a.openAfterFocus = !1, a.scrollToFocusedOptionOnUpdate = !1, a.userIsDragging = void 0, a.controlRef = null, a.getControlRef = function(u) {
      a.controlRef = u;
    }, a.focusedOptionRef = null, a.getFocusedOptionRef = function(u) {
      a.focusedOptionRef = u;
    }, a.menuListRef = null, a.getMenuListRef = function(u) {
      a.menuListRef = u;
    }, a.inputRef = null, a.getInputRef = function(u) {
      a.inputRef = u;
    }, a.focus = a.focusInput, a.blur = a.blurInput, a.onChange = function(u, p) {
      var g = a.props, v = g.onChange, y = g.name;
      p.name = y, a.ariaOnChange(u, p), v(u, p);
    }, a.setValue = function(u, p, g) {
      var v = a.props, y = v.closeMenuOnSelect, E = v.isMulti, L = v.inputValue;
      a.onInputChange("", {
        action: "set-value",
        prevInputValue: L
      }), y && (a.setState({
        inputIsHiddenAfterUpdate: !E
      }), a.onMenuClose()), a.setState({
        clearFocusValueOnUpdate: !0
      }), a.onChange(u, {
        action: p,
        option: g
      });
    }, a.selectOption = function(u) {
      var p = a.props, g = p.blurInputOnSelect, v = p.isMulti, y = p.name, E = a.state.selectValue, L = v && a.isOptionSelected(u, E), x = a.isOptionDisabled(u, E);
      if (L) {
        var C = a.getOptionValue(u);
        a.setValue(E.filter(function(T) {
          return a.getOptionValue(T) !== C;
        }), "deselect-option", u);
      } else if (!x)
        v ? a.setValue([].concat(ro(E), [u]), "select-option", u) : a.setValue(u, "select-option");
      else {
        a.ariaOnChange(u, {
          action: "select-option",
          option: u,
          name: y
        });
        return;
      }
      g && a.blurInput();
    }, a.removeValue = function(u) {
      var p = a.props.isMulti, g = a.state.selectValue, v = a.getOptionValue(u), y = g.filter(function(L) {
        return a.getOptionValue(L) !== v;
      }), E = vi(p, y, y[0] || null);
      a.onChange(E, {
        action: "remove-value",
        removedValue: u
      }), a.focusInput();
    }, a.clearValue = function() {
      var u = a.state.selectValue;
      a.onChange(vi(a.props.isMulti, [], null), {
        action: "clear",
        removedValues: u
      });
    }, a.popValue = function() {
      var u = a.props.isMulti, p = a.state.selectValue, g = p[p.length - 1], v = p.slice(0, p.length - 1), y = vi(u, v, v[0] || null);
      g && a.onChange(y, {
        action: "pop-value",
        removedValue: g
      });
    }, a.getFocusedOptionId = function(u) {
      return ss(a.state.focusableOptionsWithIds, u);
    }, a.getFocusableOptionsWithIds = function() {
      return gu(ki(a.props, a.state.selectValue), a.getElementId("option"));
    }, a.getValue = function() {
      return a.state.selectValue;
    }, a.cx = function() {
      for (var u = arguments.length, p = new Array(u), g = 0; g < u; g++)
        p[g] = arguments[g];
      return _x.apply(void 0, [a.props.classNamePrefix].concat(p));
    }, a.getOptionLabel = function(u) {
      return Hf(a.props, u);
    }, a.getOptionValue = function(u) {
      return zi(a.props, u);
    }, a.getStyles = function(u, p) {
      var g = a.props.unstyled, v = jE[u](p, g);
      v.boxSizing = "border-box";
      var y = a.props.styles[u];
      return y ? y(v, p) : v;
    }, a.getClassNames = function(u, p) {
      var g, v;
      return (g = (v = a.props.classNames)[u]) === null || g === void 0 ? void 0 : g.call(v, p);
    }, a.getElementId = function(u) {
      return "".concat(a.state.instancePrefix, "-").concat(u);
    }, a.getComponents = function() {
      return sE(a.props);
    }, a.buildCategorizedOptions = function() {
      return ki(a.props, a.state.selectValue);
    }, a.getCategorizedOptions = function() {
      return a.props.menuIsOpen ? a.buildCategorizedOptions() : [];
    }, a.buildFocusableOptions = function() {
      return Bf(a.buildCategorizedOptions());
    }, a.getFocusableOptions = function() {
      return a.props.menuIsOpen ? a.buildFocusableOptions() : [];
    }, a.ariaOnChange = function(u, p) {
      a.setState({
        ariaSelection: qe({
          value: u
        }, p)
      });
    }, a.onMenuMouseDown = function(u) {
      u.button === 0 && (u.stopPropagation(), u.preventDefault(), a.focusInput());
    }, a.onMenuMouseMove = function(u) {
      a.blockOptionHover = !1;
    }, a.onControlMouseDown = function(u) {
      if (!u.defaultPrevented) {
        var p = a.props.openMenuOnClick;
        a.state.isFocused ? a.props.menuIsOpen ? u.target.tagName !== "INPUT" && u.target.tagName !== "TEXTAREA" && a.onMenuClose() : p && a.openMenu("first") : (p && (a.openAfterFocus = !0), a.focusInput()), u.target.tagName !== "INPUT" && u.target.tagName !== "TEXTAREA" && u.preventDefault();
      }
    }, a.onDropdownIndicatorMouseDown = function(u) {
      if (!(u && u.type === "mousedown" && u.button !== 0) && !a.props.isDisabled) {
        var p = a.props, g = p.isMulti, v = p.menuIsOpen;
        a.focusInput(), v ? (a.setState({
          inputIsHiddenAfterUpdate: !g
        }), a.onMenuClose()) : a.openMenu("first"), u.preventDefault();
      }
    }, a.onClearIndicatorMouseDown = function(u) {
      u && u.type === "mousedown" && u.button !== 0 || (a.clearValue(), u.preventDefault(), a.openAfterFocus = !1, u.type === "touchend" ? a.focusInput() : setTimeout(function() {
        return a.focusInput();
      }));
    }, a.onScroll = function(u) {
      typeof a.props.closeMenuOnScroll == "boolean" ? u.target instanceof HTMLElement && bo(u.target) && a.props.onMenuClose() : typeof a.props.closeMenuOnScroll == "function" && a.props.closeMenuOnScroll(u) && a.props.onMenuClose();
    }, a.onCompositionStart = function() {
      a.isComposing = !0;
    }, a.onCompositionEnd = function() {
      a.isComposing = !1;
    }, a.onTouchStart = function(u) {
      var p = u.touches, g = p && p.item(0);
      g && (a.initialTouchX = g.clientX, a.initialTouchY = g.clientY, a.userIsDragging = !1);
    }, a.onTouchMove = function(u) {
      var p = u.touches, g = p && p.item(0);
      if (g) {
        var v = Math.abs(g.clientX - a.initialTouchX), y = Math.abs(g.clientY - a.initialTouchY), E = 5;
        a.userIsDragging = v > E || y > E;
      }
    }, a.onTouchEnd = function(u) {
      a.userIsDragging || (a.controlRef && !a.controlRef.contains(u.target) && a.menuListRef && !a.menuListRef.contains(u.target) && a.blurInput(), a.initialTouchX = 0, a.initialTouchY = 0);
    }, a.onControlTouchEnd = function(u) {
      a.userIsDragging || a.onControlMouseDown(u);
    }, a.onClearIndicatorTouchEnd = function(u) {
      a.userIsDragging || a.onClearIndicatorMouseDown(u);
    }, a.onDropdownIndicatorTouchEnd = function(u) {
      a.userIsDragging || a.onDropdownIndicatorMouseDown(u);
    }, a.handleInputChange = function(u) {
      var p = a.props.inputValue, g = u.currentTarget.value;
      a.setState({
        inputIsHiddenAfterUpdate: !1
      }), a.onInputChange(g, {
        action: "input-change",
        prevInputValue: p
      }), a.props.menuIsOpen || a.onMenuOpen();
    }, a.onInputFocus = function(u) {
      a.props.onFocus && a.props.onFocus(u), a.setState({
        inputIsHiddenAfterUpdate: !1,
        isFocused: !0
      }), (a.openAfterFocus || a.props.openMenuOnFocus) && a.openMenu("first"), a.openAfterFocus = !1;
    }, a.onInputBlur = function(u) {
      var p = a.props.inputValue;
      if (a.menuListRef && a.menuListRef.contains(document.activeElement)) {
        a.inputRef.focus();
        return;
      }
      a.props.onBlur && a.props.onBlur(u), a.onInputChange("", {
        action: "input-blur",
        prevInputValue: p
      }), a.onMenuClose(), a.setState({
        focusedValue: null,
        isFocused: !1
      });
    }, a.onOptionHover = function(u) {
      if (!(a.blockOptionHover || a.state.focusedOption === u)) {
        var p = a.getFocusableOptions(), g = p.indexOf(u);
        a.setState({
          focusedOption: u,
          focusedOptionId: g > -1 ? a.getFocusedOptionId(u) : null
        });
      }
    }, a.shouldHideSelectedOptions = function() {
      return Yf(a.props);
    }, a.onValueInputFocus = function(u) {
      u.preventDefault(), u.stopPropagation(), a.focus();
    }, a.onKeyDown = function(u) {
      var p = a.props, g = p.isMulti, v = p.backspaceRemovesValue, y = p.escapeClearsValue, E = p.inputValue, L = p.isClearable, x = p.isDisabled, C = p.menuIsOpen, T = p.onKeyDown, D = p.tabSelectsValue, k = p.openMenuOnFocus, N = a.state, R = N.focusedOption, A = N.focusedValue, f = N.selectValue;
      if (!x && !(typeof T == "function" && (T(u), u.defaultPrevented))) {
        switch (a.blockOptionHover = !0, u.key) {
          case "ArrowLeft":
            if (!g || E) return;
            a.focusValue("previous");
            break;
          case "ArrowRight":
            if (!g || E) return;
            a.focusValue("next");
            break;
          case "Delete":
          case "Backspace":
            if (E) return;
            if (A)
              a.removeValue(A);
            else {
              if (!v) return;
              g ? a.popValue() : L && a.clearValue();
            }
            break;
          case "Tab":
            if (a.isComposing || u.shiftKey || !C || !D || !R || // don't capture the event if the menu opens on focus and the focused
            // option is already selected; it breaks the flow of navigation
            k && a.isOptionSelected(R, f))
              return;
            a.selectOption(R);
            break;
          case "Enter":
            if (u.keyCode === 229)
              break;
            if (C) {
              if (!R || a.isComposing) return;
              a.selectOption(R);
              break;
            }
            return;
          case "Escape":
            C ? (a.setState({
              inputIsHiddenAfterUpdate: !1
            }), a.onInputChange("", {
              action: "menu-close",
              prevInputValue: E
            }), a.onMenuClose()) : L && y && a.clearValue();
            break;
          case " ":
            if (E)
              return;
            if (!C) {
              a.openMenu("first");
              break;
            }
            if (!R) return;
            a.selectOption(R);
            break;
          case "ArrowUp":
            C ? a.focusOption("up") : a.openMenu("last");
            break;
          case "ArrowDown":
            C ? a.focusOption("down") : a.openMenu("first");
            break;
          case "PageUp":
            if (!C) return;
            a.focusOption("pageup");
            break;
          case "PageDown":
            if (!C) return;
            a.focusOption("pagedown");
            break;
          case "Home":
            if (!C) return;
            a.focusOption("first");
            break;
          case "End":
            if (!C) return;
            a.focusOption("last");
            break;
          default:
            return;
        }
        u.preventDefault();
      }
    }, a.state.instancePrefix = "react-select-" + (a.props.instanceId || ++KE), a.state.selectValue = eu(r.value), r.menuIsOpen && a.state.selectValue.length) {
      var i = a.getFocusableOptionsWithIds(), s = a.buildFocusableOptions(), c = s.indexOf(a.state.selectValue[0]);
      a.state.focusableOptionsWithIds = i, a.state.focusedOption = s[c], a.state.focusedOptionId = ss(i, s[c]);
    }
    return a;
  }
  return kl(n, [{
    key: "componentDidMount",
    value: function() {
      this.startListeningComposition(), this.startListeningToTouch(), this.props.closeMenuOnScroll && document && document.addEventListener && document.addEventListener("scroll", this.onScroll, !0), this.props.autoFocus && this.focusInput(), this.props.menuIsOpen && this.state.focusedOption && this.menuListRef && this.focusedOptionRef && tu(this.menuListRef, this.focusedOptionRef), OE() && this.setState({
        isAppleDevice: !0
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function(a) {
      var i = this.props, s = i.isDisabled, c = i.menuIsOpen, u = this.state.isFocused;
      // ensure focus is restored correctly when the control becomes enabled
      (u && !s && a.isDisabled || // ensure focus is on the Input when the menu opens
      u && c && !a.menuIsOpen) && this.focusInput(), u && s && !a.isDisabled ? this.setState({
        isFocused: !1
      }, this.onMenuClose) : !u && !s && a.isDisabled && this.inputRef === document.activeElement && this.setState({
        isFocused: !0
      }), this.menuListRef && this.focusedOptionRef && this.scrollToFocusedOptionOnUpdate && (tu(this.menuListRef, this.focusedOptionRef), this.scrollToFocusedOptionOnUpdate = !1);
    }
  }, {
    key: "componentWillUnmount",
    value: function() {
      this.stopListeningComposition(), this.stopListeningToTouch(), document.removeEventListener("scroll", this.onScroll, !0);
    }
    // ==============================
    // Consumer Handlers
    // ==============================
  }, {
    key: "onMenuOpen",
    value: function() {
      this.props.onMenuOpen();
    }
  }, {
    key: "onMenuClose",
    value: function() {
      this.onInputChange("", {
        action: "menu-close",
        prevInputValue: this.props.inputValue
      }), this.props.onMenuClose();
    }
  }, {
    key: "onInputChange",
    value: function(a, i) {
      this.props.onInputChange(a, i);
    }
    // ==============================
    // Methods
    // ==============================
  }, {
    key: "focusInput",
    value: function() {
      this.inputRef && this.inputRef.focus();
    }
  }, {
    key: "blurInput",
    value: function() {
      this.inputRef && this.inputRef.blur();
    }
    // aliased for consumers
  }, {
    key: "openMenu",
    value: function(a) {
      var i = this, s = this.state, c = s.selectValue, u = s.isFocused, p = this.buildFocusableOptions(), g = a === "first" ? 0 : p.length - 1;
      if (!this.props.isMulti) {
        var v = p.indexOf(c[0]);
        v > -1 && (g = v);
      }
      this.scrollToFocusedOptionOnUpdate = !(u && this.menuListRef), this.setState({
        inputIsHiddenAfterUpdate: !1,
        focusedValue: null,
        focusedOption: p[g],
        focusedOptionId: this.getFocusedOptionId(p[g])
      }, function() {
        return i.onMenuOpen();
      });
    }
  }, {
    key: "focusValue",
    value: function(a) {
      var i = this.state, s = i.selectValue, c = i.focusedValue;
      if (this.props.isMulti) {
        this.setState({
          focusedOption: null
        });
        var u = s.indexOf(c);
        c || (u = -1);
        var p = s.length - 1, g = -1;
        if (s.length) {
          switch (a) {
            case "previous":
              u === 0 ? g = 0 : u === -1 ? g = p : g = u - 1;
              break;
            case "next":
              u > -1 && u < p && (g = u + 1);
              break;
          }
          this.setState({
            inputIsHidden: g !== -1,
            focusedValue: s[g]
          });
        }
      }
    }
  }, {
    key: "focusOption",
    value: function() {
      var a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "first", i = this.props.pageSize, s = this.state.focusedOption, c = this.getFocusableOptions();
      if (c.length) {
        var u = 0, p = c.indexOf(s);
        s || (p = -1), a === "up" ? u = p > 0 ? p - 1 : c.length - 1 : a === "down" ? u = (p + 1) % c.length : a === "pageup" ? (u = p - i, u < 0 && (u = 0)) : a === "pagedown" ? (u = p + i, u > c.length - 1 && (u = c.length - 1)) : a === "last" && (u = c.length - 1), this.scrollToFocusedOptionOnUpdate = !0, this.setState({
          focusedOption: c[u],
          focusedValue: null,
          focusedOptionId: this.getFocusedOptionId(c[u])
        });
      }
    }
  }, {
    key: "getTheme",
    value: (
      // ==============================
      // Getters
      // ==============================
      function() {
        return this.props.theme ? typeof this.props.theme == "function" ? this.props.theme(os) : qe(qe({}, os), this.props.theme) : os;
      }
    )
  }, {
    key: "getCommonProps",
    value: function() {
      var a = this.clearValue, i = this.cx, s = this.getStyles, c = this.getClassNames, u = this.getValue, p = this.selectOption, g = this.setValue, v = this.props, y = v.isMulti, E = v.isRtl, L = v.options, x = this.hasValue();
      return {
        clearValue: a,
        cx: i,
        getStyles: s,
        getClassNames: c,
        getValue: u,
        hasValue: x,
        isMulti: y,
        isRtl: E,
        options: L,
        selectOption: p,
        selectProps: v,
        setValue: g,
        theme: this.getTheme()
      };
    }
  }, {
    key: "hasValue",
    value: function() {
      var a = this.state.selectValue;
      return a.length > 0;
    }
  }, {
    key: "hasOptions",
    value: function() {
      return !!this.getFocusableOptions().length;
    }
  }, {
    key: "isClearable",
    value: function() {
      var a = this.props, i = a.isClearable, s = a.isMulti;
      return i === void 0 ? s : i;
    }
  }, {
    key: "isOptionDisabled",
    value: function(a, i) {
      return zf(this.props, a, i);
    }
  }, {
    key: "isOptionSelected",
    value: function(a, i) {
      return qf(this.props, a, i);
    }
  }, {
    key: "filterOption",
    value: function(a, i) {
      return Wf(this.props, a, i);
    }
  }, {
    key: "formatOptionLabel",
    value: function(a, i) {
      if (typeof this.props.formatOptionLabel == "function") {
        var s = this.props.inputValue, c = this.state.selectValue;
        return this.props.formatOptionLabel(a, {
          context: i,
          inputValue: s,
          selectValue: c
        });
      } else
        return this.getOptionLabel(a);
    }
  }, {
    key: "formatGroupLabel",
    value: function(a) {
      return this.props.formatGroupLabel(a);
    }
    // ==============================
    // Mouse Handlers
    // ==============================
  }, {
    key: "startListeningComposition",
    value: (
      // ==============================
      // Composition Handlers
      // ==============================
      function() {
        document && document.addEventListener && (document.addEventListener("compositionstart", this.onCompositionStart, !1), document.addEventListener("compositionend", this.onCompositionEnd, !1));
      }
    )
  }, {
    key: "stopListeningComposition",
    value: function() {
      document && document.removeEventListener && (document.removeEventListener("compositionstart", this.onCompositionStart), document.removeEventListener("compositionend", this.onCompositionEnd));
    }
  }, {
    key: "startListeningToTouch",
    value: (
      // ==============================
      // Touch Handlers
      // ==============================
      function() {
        document && document.addEventListener && (document.addEventListener("touchstart", this.onTouchStart, !1), document.addEventListener("touchmove", this.onTouchMove, !1), document.addEventListener("touchend", this.onTouchEnd, !1));
      }
    )
  }, {
    key: "stopListeningToTouch",
    value: function() {
      document && document.removeEventListener && (document.removeEventListener("touchstart", this.onTouchStart), document.removeEventListener("touchmove", this.onTouchMove), document.removeEventListener("touchend", this.onTouchEnd));
    }
  }, {
    key: "renderInput",
    value: (
      // ==============================
      // Renderers
      // ==============================
      function() {
        var a = this.props, i = a.isDisabled, s = a.isSearchable, c = a.inputId, u = a.inputValue, p = a.tabIndex, g = a.form, v = a.menuIsOpen, y = a.required, E = this.getComponents(), L = E.Input, x = this.state, C = x.inputIsHidden, T = x.ariaSelection, D = this.commonProps, k = c || this.getElementId("input"), N = qe(qe(qe({
          "aria-autocomplete": "list",
          "aria-expanded": v,
          "aria-haspopup": !0,
          "aria-errormessage": this.props["aria-errormessage"],
          "aria-invalid": this.props["aria-invalid"],
          "aria-label": this.props["aria-label"],
          "aria-labelledby": this.props["aria-labelledby"],
          "aria-required": y,
          role: "combobox",
          "aria-activedescendant": this.state.isAppleDevice ? void 0 : this.state.focusedOptionId || ""
        }, v && {
          "aria-controls": this.getElementId("listbox")
        }), !s && {
          "aria-readonly": !0
        }), this.hasValue() ? (T == null ? void 0 : T.action) === "initial-input-focus" && {
          "aria-describedby": this.getElementId("live-region")
        } : {
          "aria-describedby": this.getElementId("placeholder")
        });
        return s ? /* @__PURE__ */ le.createElement(L, Z({}, D, {
          autoCapitalize: "none",
          autoComplete: "off",
          autoCorrect: "off",
          id: k,
          innerRef: this.getInputRef,
          isDisabled: i,
          isHidden: C,
          onBlur: this.onInputBlur,
          onChange: this.handleInputChange,
          onFocus: this.onInputFocus,
          spellCheck: "false",
          tabIndex: p,
          form: g,
          type: "text",
          value: u
        }, N)) : /* @__PURE__ */ le.createElement(xE, Z({
          id: k,
          innerRef: this.getInputRef,
          onBlur: this.onInputBlur,
          onChange: Bi,
          onFocus: this.onInputFocus,
          disabled: i,
          tabIndex: p,
          inputMode: "none",
          form: g,
          value: ""
        }, N));
      }
    )
  }, {
    key: "renderPlaceholderOrValue",
    value: function() {
      var a = this, i = this.getComponents(), s = i.MultiValue, c = i.MultiValueContainer, u = i.MultiValueLabel, p = i.MultiValueRemove, g = i.SingleValue, v = i.Placeholder, y = this.commonProps, E = this.props, L = E.controlShouldRenderValue, x = E.isDisabled, C = E.isMulti, T = E.inputValue, D = E.placeholder, k = this.state, N = k.selectValue, R = k.focusedValue, A = k.isFocused;
      if (!this.hasValue() || !L)
        return T ? null : /* @__PURE__ */ le.createElement(v, Z({}, y, {
          key: "placeholder",
          isDisabled: x,
          isFocused: A,
          innerProps: {
            id: this.getElementId("placeholder")
          }
        }), D);
      if (C)
        return N.map(function(_, O) {
          var J = _ === R, ee = "".concat(a.getOptionLabel(_), "-").concat(a.getOptionValue(_));
          return /* @__PURE__ */ le.createElement(s, Z({}, y, {
            components: {
              Container: c,
              Label: u,
              Remove: p
            },
            isFocused: J,
            isDisabled: x,
            key: ee,
            index: O,
            removeProps: {
              onClick: function() {
                return a.removeValue(_);
              },
              onTouchEnd: function() {
                return a.removeValue(_);
              },
              onMouseDown: function(ie) {
                ie.preventDefault();
              }
            },
            data: _
          }), a.formatOptionLabel(_, "value"));
        });
      if (T)
        return null;
      var f = N[0];
      return /* @__PURE__ */ le.createElement(g, Z({}, y, {
        data: f,
        isDisabled: x
      }), this.formatOptionLabel(f, "value"));
    }
  }, {
    key: "renderClearIndicator",
    value: function() {
      var a = this.getComponents(), i = a.ClearIndicator, s = this.commonProps, c = this.props, u = c.isDisabled, p = c.isLoading, g = this.state.isFocused;
      if (!this.isClearable() || !i || u || !this.hasValue() || p)
        return null;
      var v = {
        onMouseDown: this.onClearIndicatorMouseDown,
        onTouchEnd: this.onClearIndicatorTouchEnd,
        "aria-hidden": "true"
      };
      return /* @__PURE__ */ le.createElement(i, Z({}, s, {
        innerProps: v,
        isFocused: g
      }));
    }
  }, {
    key: "renderLoadingIndicator",
    value: function() {
      var a = this.getComponents(), i = a.LoadingIndicator, s = this.commonProps, c = this.props, u = c.isDisabled, p = c.isLoading, g = this.state.isFocused;
      if (!i || !p) return null;
      var v = {
        "aria-hidden": "true"
      };
      return /* @__PURE__ */ le.createElement(i, Z({}, s, {
        innerProps: v,
        isDisabled: u,
        isFocused: g
      }));
    }
  }, {
    key: "renderIndicatorSeparator",
    value: function() {
      var a = this.getComponents(), i = a.DropdownIndicator, s = a.IndicatorSeparator;
      if (!i || !s) return null;
      var c = this.commonProps, u = this.props.isDisabled, p = this.state.isFocused;
      return /* @__PURE__ */ le.createElement(s, Z({}, c, {
        isDisabled: u,
        isFocused: p
      }));
    }
  }, {
    key: "renderDropdownIndicator",
    value: function() {
      var a = this.getComponents(), i = a.DropdownIndicator;
      if (!i) return null;
      var s = this.commonProps, c = this.props.isDisabled, u = this.state.isFocused, p = {
        onMouseDown: this.onDropdownIndicatorMouseDown,
        onTouchEnd: this.onDropdownIndicatorTouchEnd,
        "aria-hidden": "true"
      };
      return /* @__PURE__ */ le.createElement(i, Z({}, s, {
        innerProps: p,
        isDisabled: c,
        isFocused: u
      }));
    }
  }, {
    key: "renderMenu",
    value: function() {
      var a = this, i = this.getComponents(), s = i.Group, c = i.GroupHeading, u = i.Menu, p = i.MenuList, g = i.MenuPortal, v = i.LoadingMessage, y = i.NoOptionsMessage, E = i.Option, L = this.commonProps, x = this.state.focusedOption, C = this.props, T = C.captureMenuScroll, D = C.inputValue, k = C.isLoading, N = C.loadingMessage, R = C.minMenuHeight, A = C.maxMenuHeight, f = C.menuIsOpen, _ = C.menuPlacement, O = C.menuPosition, J = C.menuPortalTarget, ee = C.menuShouldBlockScroll, ge = C.menuShouldScrollIntoView, ie = C.noOptionsMessage, fe = C.onMenuScrollToTop, be = C.onMenuScrollToBottom;
      if (!f) return null;
      var $e = function(Me, Ze) {
        var at = Me.type, He = Me.data, nt = Me.isDisabled, yt = Me.isSelected, Ct = Me.label, rt = Me.value, mt = x === He, dt = nt ? void 0 : function() {
          return a.onOptionHover(He);
        }, Ie = nt ? void 0 : function() {
          return a.selectOption(He);
        }, Ue = "".concat(a.getElementId("option"), "-").concat(Ze), Xe = {
          id: Ue,
          onClick: Ie,
          onMouseMove: dt,
          onMouseOver: dt,
          tabIndex: -1,
          role: "option",
          "aria-selected": a.state.isAppleDevice ? void 0 : yt
          // is not supported on Apple devices
        };
        return /* @__PURE__ */ le.createElement(E, Z({}, L, {
          innerProps: Xe,
          data: He,
          isDisabled: nt,
          isSelected: yt,
          key: Ue,
          label: Ct,
          type: at,
          value: rt,
          isFocused: mt,
          innerRef: mt ? a.getFocusedOptionRef : void 0
        }), a.formatOptionLabel(Me.data, "menu"));
      }, Se;
      if (this.hasOptions())
        Se = this.getCategorizedOptions().map(function(Ne) {
          if (Ne.type === "group") {
            var Me = Ne.data, Ze = Ne.options, at = Ne.index, He = "".concat(a.getElementId("group"), "-").concat(at), nt = "".concat(He, "-heading");
            return /* @__PURE__ */ le.createElement(s, Z({}, L, {
              key: He,
              data: Me,
              options: Ze,
              Heading: c,
              headingProps: {
                id: nt,
                data: Ne.data
              },
              label: a.formatGroupLabel(Ne.data)
            }), Ne.options.map(function(yt) {
              return $e(yt, "".concat(at, "-").concat(yt.index));
            }));
          } else if (Ne.type === "option")
            return $e(Ne, "".concat(Ne.index));
        });
      else if (k) {
        var xe = N({
          inputValue: D
        });
        if (xe === null) return null;
        Se = /* @__PURE__ */ le.createElement(v, L, xe);
      } else {
        var Te = ie({
          inputValue: D
        });
        if (Te === null) return null;
        Se = /* @__PURE__ */ le.createElement(y, L, Te);
      }
      var We = {
        minMenuHeight: R,
        maxMenuHeight: A,
        menuPlacement: _,
        menuPosition: O,
        menuShouldScrollIntoView: ge
      }, Oe = /* @__PURE__ */ le.createElement(e0, Z({}, L, We), function(Ne) {
        var Me = Ne.ref, Ze = Ne.placerProps, at = Ze.placement, He = Ze.maxHeight;
        return /* @__PURE__ */ le.createElement(u, Z({}, L, We, {
          innerRef: Me,
          innerProps: {
            onMouseDown: a.onMenuMouseDown,
            onMouseMove: a.onMenuMouseMove
          },
          isLoading: k,
          placement: at
        }), /* @__PURE__ */ le.createElement(DE, {
          captureEnabled: T,
          onTopArrive: fe,
          onBottomArrive: be,
          lockEnabled: ee
        }, function(nt) {
          return /* @__PURE__ */ le.createElement(p, Z({}, L, {
            innerRef: function(Ct) {
              a.getMenuListRef(Ct), nt(Ct);
            },
            innerProps: {
              role: "listbox",
              "aria-multiselectable": L.isMulti,
              id: a.getElementId("listbox")
            },
            isLoading: k,
            maxHeight: He,
            focusedOption: x
          }), Se);
        }));
      });
      return J || O === "fixed" ? /* @__PURE__ */ le.createElement(g, Z({}, L, {
        appendTo: J,
        controlElement: this.controlRef,
        menuPlacement: _,
        menuPosition: O
      }), Oe) : Oe;
    }
  }, {
    key: "renderFormField",
    value: function() {
      var a = this, i = this.props, s = i.delimiter, c = i.isDisabled, u = i.isMulti, p = i.name, g = i.required, v = this.state.selectValue;
      if (g && !this.hasValue() && !c)
        return /* @__PURE__ */ le.createElement(NE, {
          name: p,
          onFocus: this.onValueInputFocus
        });
      if (!(!p || c))
        if (u)
          if (s) {
            var y = v.map(function(x) {
              return a.getOptionValue(x);
            }).join(s);
            return /* @__PURE__ */ le.createElement("input", {
              name: p,
              type: "hidden",
              value: y
            });
          } else {
            var E = v.length > 0 ? v.map(function(x, C) {
              return /* @__PURE__ */ le.createElement("input", {
                key: "i-".concat(C),
                name: p,
                type: "hidden",
                value: a.getOptionValue(x)
              });
            }) : /* @__PURE__ */ le.createElement("input", {
              name: p,
              type: "hidden",
              value: ""
            });
            return /* @__PURE__ */ le.createElement("div", null, E);
          }
        else {
          var L = v[0] ? this.getOptionValue(v[0]) : "";
          return /* @__PURE__ */ le.createElement("input", {
            name: p,
            type: "hidden",
            value: L
          });
        }
    }
  }, {
    key: "renderLiveRegion",
    value: function() {
      var a = this.commonProps, i = this.state, s = i.ariaSelection, c = i.focusedOption, u = i.focusedValue, p = i.isFocused, g = i.selectValue, v = this.getFocusableOptions();
      return /* @__PURE__ */ le.createElement(gE, Z({}, a, {
        id: this.getElementId("live-region"),
        ariaSelection: s,
        focusedOption: c,
        focusedValue: u,
        isFocused: p,
        selectValue: g,
        focusableOptions: v,
        isAppleDevice: this.state.isAppleDevice
      }));
    }
  }, {
    key: "render",
    value: function() {
      var a = this.getComponents(), i = a.Control, s = a.IndicatorsContainer, c = a.SelectContainer, u = a.ValueContainer, p = this.props, g = p.className, v = p.id, y = p.isDisabled, E = p.menuIsOpen, L = this.state.isFocused, x = this.commonProps = this.getCommonProps();
      return /* @__PURE__ */ le.createElement(c, Z({}, x, {
        className: g,
        innerProps: {
          id: v,
          onKeyDown: this.onKeyDown
        },
        isDisabled: y,
        isFocused: L
      }), this.renderLiveRegion(), /* @__PURE__ */ le.createElement(i, Z({}, x, {
        innerRef: this.getControlRef,
        innerProps: {
          onMouseDown: this.onControlMouseDown,
          onTouchEnd: this.onControlTouchEnd
        },
        isDisabled: y,
        isFocused: L,
        menuIsOpen: E
      }), /* @__PURE__ */ le.createElement(u, Z({}, x, {
        isDisabled: y
      }), this.renderPlaceholderOrValue(), this.renderInput()), /* @__PURE__ */ le.createElement(s, Z({}, x, {
        isDisabled: y
      }), this.renderClearIndicator(), this.renderLoadingIndicator(), this.renderIndicatorSeparator(), this.renderDropdownIndicator())), this.renderMenu(), this.renderFormField());
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function(a, i) {
      var s = i.prevProps, c = i.clearFocusValueOnUpdate, u = i.inputIsHiddenAfterUpdate, p = i.ariaSelection, g = i.isFocused, v = i.prevWasFocused, y = i.instancePrefix, E = a.options, L = a.value, x = a.menuIsOpen, C = a.inputValue, T = a.isMulti, D = eu(L), k = {};
      if (s && (L !== s.value || E !== s.options || x !== s.menuIsOpen || C !== s.inputValue)) {
        var N = x ? WE(a, D) : [], R = x ? gu(ki(a, D), "".concat(y, "-option")) : [], A = c ? YE(i, D) : null, f = GE(i, N), _ = ss(R, f);
        k = {
          selectValue: D,
          focusedOption: f,
          focusedOptionId: _,
          focusableOptionsWithIds: R,
          focusedValue: A,
          clearFocusValueOnUpdate: !1
        };
      }
      var O = u != null && a !== s ? {
        inputIsHidden: u,
        inputIsHiddenAfterUpdate: void 0
      } : {}, J = p, ee = g && v;
      return g && !ee && (J = {
        value: vi(T, D, D[0] || null),
        options: D,
        action: "initial-input-focus"
      }, ee = !v), (p == null ? void 0 : p.action) === "initial-input-focus" && (J = null), qe(qe(qe({}, k), O), {}, {
        prevProps: a,
        ariaSelection: J,
        prevWasFocused: ee
      });
    }
  }]), n;
}(mm);
Gf.defaultProps = qE;
var JE = /* @__PURE__ */ Xi(function(e, t) {
  var n = iw(e);
  return /* @__PURE__ */ le.createElement(Gf, Z({
    ref: t
  }, n));
}), QE = JE;
function Kf(e) {
  var t, n, r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object") if (Array.isArray(e)) for (t = 0; t < e.length; t++) e[t] && (n = Kf(e[t])) && (r && (r += " "), r += n);
  else for (t in e) e[t] && (r && (r += " "), r += t);
  return r;
}
function ls() {
  for (var e, t, n = 0, r = ""; n < arguments.length; ) (e = arguments[n++]) && (t = Kf(e)) && (r && (r += " "), r += t);
  return r;
}
function cs(e) {
  return e && Sr(e) === "object" && e.constructor === Object;
}
function Vr(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
    clone: !0
  }, r = n.clone ? Z({}, e) : e;
  return cs(e) && cs(t) && Object.keys(t).forEach(function(a) {
    a !== "__proto__" && (cs(t[a]) && a in e ? r[a] = Vr(e[a], t[a], n) : r[a] = t[a]);
  }), r;
}
function qi(e) {
  for (var t = "https://mui.com/production-error/?code=" + e, n = 1; n < arguments.length; n += 1)
    t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified Material-UI error #" + e + "; visit " + t + " for the full message.";
}
function zl(e) {
  var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0, n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
  return Math.min(Math.max(t, e), n);
}
function XE(e) {
  e = e.substr(1);
  var t = new RegExp(".{1,".concat(e.length >= 6 ? 2 : 1, "}"), "g"), n = e.match(t);
  return n && n[0].length === 1 && (n = n.map(function(r) {
    return r + r;
  })), n ? "rgb".concat(n.length === 4 ? "a" : "", "(").concat(n.map(function(r, a) {
    return a < 3 ? parseInt(r, 16) : Math.round(parseInt(r, 16) / 255 * 1e3) / 1e3;
  }).join(", "), ")") : "";
}
function ZE(e) {
  e = Ur(e);
  var t = e, n = t.values, r = n[0], a = n[1] / 100, i = n[2] / 100, s = a * Math.min(i, 1 - i), c = function(v) {
    var y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : (v + r / 30) % 12;
    return i - s * Math.max(Math.min(y - 3, 9 - y, 1), -1);
  }, u = "rgb", p = [Math.round(c(0) * 255), Math.round(c(8) * 255), Math.round(c(4) * 255)];
  return e.type === "hsla" && (u += "a", p.push(n[3])), wo({
    type: u,
    values: p
  });
}
function Ur(e) {
  if (e.type)
    return e;
  if (e.charAt(0) === "#")
    return Ur(XE(e));
  var t = e.indexOf("("), n = e.substring(0, t);
  if (["rgb", "rgba", "hsl", "hsla"].indexOf(n) === -1)
    throw new Error(qi(3, e));
  var r = e.substring(t + 1, e.length - 1).split(",");
  return r = r.map(function(a) {
    return parseFloat(a);
  }), {
    type: n,
    values: r
  };
}
function wo(e) {
  var t = e.type, n = e.values;
  return t.indexOf("rgb") !== -1 ? n = n.map(function(r, a) {
    return a < 3 ? parseInt(r, 10) : r;
  }) : t.indexOf("hsl") !== -1 && (n[1] = "".concat(n[1], "%"), n[2] = "".concat(n[2], "%")), "".concat(t, "(").concat(n.join(", "), ")");
}
function e1(e, t) {
  var n = vu(e), r = vu(t);
  return (Math.max(n, r) + 0.05) / (Math.min(n, r) + 0.05);
}
function vu(e) {
  e = Ur(e);
  var t = e.type === "hsl" ? Ur(ZE(e)).values : e.values;
  return t = t.map(function(n) {
    return n /= 255, n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  }), Number((0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]).toFixed(3));
}
function yu(e, t) {
  return e = Ur(e), t = zl(t), (e.type === "rgb" || e.type === "hsl") && (e.type += "a"), e.values[3] = t, wo(e);
}
function t1(e, t) {
  if (e = Ur(e), t = zl(t), e.type.indexOf("hsl") !== -1)
    e.values[2] *= 1 - t;
  else if (e.type.indexOf("rgb") !== -1)
    for (var n = 0; n < 3; n += 1)
      e.values[n] *= 1 - t;
  return wo(e);
}
function n1(e, t) {
  if (e = Ur(e), t = zl(t), e.type.indexOf("hsl") !== -1)
    e.values[2] += (100 - e.values[2]) * t;
  else if (e.type.indexOf("rgb") !== -1)
    for (var n = 0; n < 3; n += 1)
      e.values[n] += (255 - e.values[n]) * t;
  return wo(e);
}
var r1 = typeof Symbol == "function" && Symbol.for;
const a1 = r1 ? Symbol.for("mui.nested") : "__THEME_NESTED__";
var i1 = ["checked", "disabled", "error", "focused", "focusVisible", "required", "expanded", "selected"];
function o1() {
  var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = e.disableGlobal, n = t === void 0 ? !1 : t, r = e.productionPrefix, a = r === void 0 ? "jss" : r, i = e.seed, s = i === void 0 ? "" : i, c = s === "" ? "" : "".concat(s, "-"), u = 0, p = function() {
    return u += 1, u;
  };
  return function(g, v) {
    var y = v.options.name;
    if (y && y.indexOf("Mui") === 0 && !v.options.link && !n) {
      if (i1.indexOf(g.key) !== -1)
        return "Mui-".concat(g.key);
      var E = "".concat(c).concat(y, "-").concat(g.key);
      return !v.options.theme[a1] || s !== "" ? E : "".concat(E, "-").concat(p());
    }
    return "".concat(c).concat(a).concat(p());
  };
}
function s1(e) {
  var t = e.theme, n = e.name, r = e.props;
  if (!t || !t.props || !t.props[n])
    return r;
  var a = t.props[n], i;
  for (i in a)
    r[i] === void 0 && (r[i] = a[i]);
  return r;
}
var bu = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
  return typeof e;
} : function(e) {
  return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
}, Ya = (typeof window > "u" ? "undefined" : bu(window)) === "object" && (typeof document > "u" ? "undefined" : bu(document)) === "object" && document.nodeType === 9;
function xo(e, t) {
  e.prototype = Object.create(t.prototype), e.prototype.constructor = e, $i(e, t);
}
var l1 = {}.constructor;
function Xs(e) {
  if (e == null || typeof e != "object") return e;
  if (Array.isArray(e)) return e.map(Xs);
  if (e.constructor !== l1) return e;
  var t = {};
  for (var n in e)
    t[n] = Xs(e[n]);
  return t;
}
function ql(e, t, n) {
  e === void 0 && (e = "unnamed");
  var r = n.jss, a = Xs(t), i = r.plugins.onCreateRule(e, a, n);
  return i || (e[0], null);
}
var wu = function(t, n) {
  for (var r = "", a = 0; a < t.length && t[a] !== "!important"; a++)
    r && (r += n), r += t[a];
  return r;
}, _r = function(t) {
  if (!Array.isArray(t)) return t;
  var n = "";
  if (Array.isArray(t[0]))
    for (var r = 0; r < t.length && t[r] !== "!important"; r++)
      n && (n += ", "), n += wu(t[r], " ");
  else n = wu(t, ", ");
  return t[t.length - 1] === "!important" && (n += " !important"), n;
};
function ga(e) {
  return e && e.format === !1 ? {
    linebreak: "",
    space: ""
  } : {
    linebreak: `
`,
    space: " "
  };
}
function Aa(e, t) {
  for (var n = "", r = 0; r < t; r++)
    n += "  ";
  return n + e;
}
function Ha(e, t, n) {
  n === void 0 && (n = {});
  var r = "";
  if (!t) return r;
  var a = n, i = a.indent, s = i === void 0 ? 0 : i, c = t.fallbacks;
  n.format === !1 && (s = -1 / 0);
  var u = ga(n), p = u.linebreak, g = u.space;
  if (e && s++, c)
    if (Array.isArray(c))
      for (var v = 0; v < c.length; v++) {
        var y = c[v];
        for (var E in y) {
          var L = y[E];
          L != null && (r && (r += p), r += Aa(E + ":" + g + _r(L) + ";", s));
        }
      }
    else
      for (var x in c) {
        var C = c[x];
        C != null && (r && (r += p), r += Aa(x + ":" + g + _r(C) + ";", s));
      }
  for (var T in t) {
    var D = t[T];
    D != null && T !== "fallbacks" && (r && (r += p), r += Aa(T + ":" + g + _r(D) + ";", s));
  }
  return !r && !n.allowEmpty || !e ? r : (s--, r && (r = "" + p + r + p), Aa("" + e + g + "{" + r, s) + Aa("}", s));
}
var c1 = /([[\].#*$><+~=|^:(),"'`\s])/g, xu = typeof CSS < "u" && CSS.escape, Wl = function(e) {
  return xu ? xu(e) : e.replace(c1, "\\$1");
}, Jf = /* @__PURE__ */ function() {
  function e(n, r, a) {
    this.type = "style", this.isProcessed = !1;
    var i = a.sheet, s = a.Renderer;
    this.key = n, this.options = a, this.style = r, i ? this.renderer = i.renderer : s && (this.renderer = new s());
  }
  var t = e.prototype;
  return t.prop = function(r, a, i) {
    if (a === void 0) return this.style[r];
    var s = i ? i.force : !1;
    if (!s && this.style[r] === a) return this;
    var c = a;
    (!i || i.process !== !1) && (c = this.options.jss.plugins.onChangeValue(a, r, this));
    var u = c == null || c === !1, p = r in this.style;
    if (u && !p && !s) return this;
    var g = u && p;
    if (g ? delete this.style[r] : this.style[r] = c, this.renderable && this.renderer)
      return g ? this.renderer.removeProperty(this.renderable, r) : this.renderer.setProperty(this.renderable, r, c), this;
    var v = this.options.sheet;
    return v && v.attached, this;
  }, e;
}(), Zs = /* @__PURE__ */ function(e) {
  xo(t, e);
  function t(r, a, i) {
    var s;
    s = e.call(this, r, a, i) || this;
    var c = i.selector, u = i.scoped, p = i.sheet, g = i.generateId;
    return c ? s.selectorText = c : u !== !1 && (s.id = g(qs(qs(s)), p), s.selectorText = "." + Wl(s.id)), s;
  }
  var n = t.prototype;
  return n.applyTo = function(a) {
    var i = this.renderer;
    if (i) {
      var s = this.toJSON();
      for (var c in s)
        i.setProperty(a, c, s[c]);
    }
    return this;
  }, n.toJSON = function() {
    var a = {};
    for (var i in this.style) {
      var s = this.style[i];
      typeof s != "object" ? a[i] = s : Array.isArray(s) && (a[i] = _r(s));
    }
    return a;
  }, n.toString = function(a) {
    var i = this.options.sheet, s = i ? i.options.link : !1, c = s ? Z({}, a, {
      allowEmpty: !0
    }) : a;
    return Ha(this.selectorText, this.style, c);
  }, kl(t, [{
    key: "selector",
    set: function(a) {
      if (a !== this.selectorText) {
        this.selectorText = a;
        var i = this.renderer, s = this.renderable;
        if (!(!s || !i)) {
          var c = i.setSelector(s, a);
          c || i.replaceRule(s, this);
        }
      }
    },
    get: function() {
      return this.selectorText;
    }
  }]), t;
}(Jf), u1 = {
  onCreateRule: function(t, n, r) {
    return t[0] === "@" || r.parent && r.parent.type === "keyframes" ? null : new Zs(t, n, r);
  }
}, us = {
  indent: 1,
  children: !0
}, d1 = /@([\w-]+)/, f1 = /* @__PURE__ */ function() {
  function e(n, r, a) {
    this.type = "conditional", this.isProcessed = !1, this.key = n;
    var i = n.match(d1);
    this.at = i ? i[1] : "unknown", this.query = a.name || "@" + this.at, this.options = a, this.rules = new Eo(Z({}, a, {
      parent: this
    }));
    for (var s in r)
      this.rules.add(s, r[s]);
    this.rules.process();
  }
  var t = e.prototype;
  return t.getRule = function(r) {
    return this.rules.get(r);
  }, t.indexOf = function(r) {
    return this.rules.indexOf(r);
  }, t.addRule = function(r, a, i) {
    var s = this.rules.add(r, a, i);
    return s ? (this.options.jss.plugins.onProcessRule(s), s) : null;
  }, t.replaceRule = function(r, a, i) {
    var s = this.rules.replace(r, a, i);
    return s && this.options.jss.plugins.onProcessRule(s), s;
  }, t.toString = function(r) {
    r === void 0 && (r = us);
    var a = ga(r), i = a.linebreak;
    if (r.indent == null && (r.indent = us.indent), r.children == null && (r.children = us.children), r.children === !1)
      return this.query + " {}";
    var s = this.rules.toString(r);
    return s ? this.query + " {" + i + s + i + "}" : "";
  }, e;
}(), p1 = /@container|@media|@supports\s+/, m1 = {
  onCreateRule: function(t, n, r) {
    return p1.test(t) ? new f1(t, n, r) : null;
  }
}, ds = {
  indent: 1,
  children: !0
}, g1 = /@keyframes\s+([\w-]+)/, el = /* @__PURE__ */ function() {
  function e(n, r, a) {
    this.type = "keyframes", this.at = "@keyframes", this.isProcessed = !1;
    var i = n.match(g1);
    i && i[1] ? this.name = i[1] : this.name = "noname", this.key = this.type + "-" + this.name, this.options = a;
    var s = a.scoped, c = a.sheet, u = a.generateId;
    this.id = s === !1 ? this.name : Wl(u(this, c)), this.rules = new Eo(Z({}, a, {
      parent: this
    }));
    for (var p in r)
      this.rules.add(p, r[p], Z({}, a, {
        parent: this
      }));
    this.rules.process();
  }
  var t = e.prototype;
  return t.toString = function(r) {
    r === void 0 && (r = ds);
    var a = ga(r), i = a.linebreak;
    if (r.indent == null && (r.indent = ds.indent), r.children == null && (r.children = ds.children), r.children === !1)
      return this.at + " " + this.id + " {}";
    var s = this.rules.toString(r);
    return s && (s = "" + i + s + i), this.at + " " + this.id + " {" + s + "}";
  }, e;
}(), h1 = /@keyframes\s+/, v1 = /\$([\w-]+)/g, tl = function(t, n) {
  return typeof t == "string" ? t.replace(v1, function(r, a) {
    return a in n ? n[a] : r;
  }) : t;
}, Eu = function(t, n, r) {
  var a = t[n], i = tl(a, r);
  i !== a && (t[n] = i);
}, y1 = {
  onCreateRule: function(t, n, r) {
    return typeof t == "string" && h1.test(t) ? new el(t, n, r) : null;
  },
  // Animation name ref replacer.
  onProcessStyle: function(t, n, r) {
    return n.type !== "style" || !r || ("animation-name" in t && Eu(t, "animation-name", r.keyframes), "animation" in t && Eu(t, "animation", r.keyframes)), t;
  },
  onChangeValue: function(t, n, r) {
    var a = r.options.sheet;
    if (!a)
      return t;
    switch (n) {
      case "animation":
        return tl(t, a.keyframes);
      case "animation-name":
        return tl(t, a.keyframes);
      default:
        return t;
    }
  }
}, b1 = /* @__PURE__ */ function(e) {
  xo(t, e);
  function t() {
    return e.apply(this, arguments) || this;
  }
  var n = t.prototype;
  return n.toString = function(a) {
    var i = this.options.sheet, s = i ? i.options.link : !1, c = s ? Z({}, a, {
      allowEmpty: !0
    }) : a;
    return Ha(this.key, this.style, c);
  }, t;
}(Jf), w1 = {
  onCreateRule: function(t, n, r) {
    return r.parent && r.parent.type === "keyframes" ? new b1(t, n, r) : null;
  }
}, x1 = /* @__PURE__ */ function() {
  function e(n, r, a) {
    this.type = "font-face", this.at = "@font-face", this.isProcessed = !1, this.key = n, this.style = r, this.options = a;
  }
  var t = e.prototype;
  return t.toString = function(r) {
    var a = ga(r), i = a.linebreak;
    if (Array.isArray(this.style)) {
      for (var s = "", c = 0; c < this.style.length; c++)
        s += Ha(this.at, this.style[c]), this.style[c + 1] && (s += i);
      return s;
    }
    return Ha(this.at, this.style, r);
  }, e;
}(), E1 = /@font-face/, L1 = {
  onCreateRule: function(t, n, r) {
    return E1.test(t) ? new x1(t, n, r) : null;
  }
}, C1 = /* @__PURE__ */ function() {
  function e(n, r, a) {
    this.type = "viewport", this.at = "@viewport", this.isProcessed = !1, this.key = n, this.style = r, this.options = a;
  }
  var t = e.prototype;
  return t.toString = function(r) {
    return Ha(this.key, this.style, r);
  }, e;
}(), S1 = {
  onCreateRule: function(t, n, r) {
    return t === "@viewport" || t === "@-ms-viewport" ? new C1(t, n, r) : null;
  }
}, T1 = /* @__PURE__ */ function() {
  function e(n, r, a) {
    this.type = "simple", this.isProcessed = !1, this.key = n, this.value = r, this.options = a;
  }
  var t = e.prototype;
  return t.toString = function(r) {
    if (Array.isArray(this.value)) {
      for (var a = "", i = 0; i < this.value.length; i++)
        a += this.key + " " + this.value[i] + ";", this.value[i + 1] && (a += `
`);
      return a;
    }
    return this.key + " " + this.value + ";";
  }, e;
}(), D1 = {
  "@charset": !0,
  "@import": !0,
  "@namespace": !0
}, k1 = {
  onCreateRule: function(t, n, r) {
    return t in D1 ? new T1(t, n, r) : null;
  }
}, Lu = [u1, m1, y1, w1, L1, S1, k1], P1 = {
  process: !0
}, Cu = {
  force: !0,
  process: !0
  /**
   * Contains rules objects and allows adding/removing etc.
   * Is used for e.g. by `StyleSheet` or `ConditionalRule`.
   */
}, Eo = /* @__PURE__ */ function() {
  function e(n) {
    this.map = {}, this.raw = {}, this.index = [], this.counter = 0, this.options = n, this.classes = n.classes, this.keyframes = n.keyframes;
  }
  var t = e.prototype;
  return t.add = function(r, a, i) {
    var s = this.options, c = s.parent, u = s.sheet, p = s.jss, g = s.Renderer, v = s.generateId, y = s.scoped, E = Z({
      classes: this.classes,
      parent: c,
      sheet: u,
      jss: p,
      Renderer: g,
      generateId: v,
      scoped: y,
      name: r,
      keyframes: this.keyframes,
      selector: void 0
    }, i), L = r;
    r in this.raw && (L = r + "-d" + this.counter++), this.raw[L] = a, L in this.classes && (E.selector = "." + Wl(this.classes[L]));
    var x = ql(L, a, E);
    if (!x) return null;
    this.register(x);
    var C = E.index === void 0 ? this.index.length : E.index;
    return this.index.splice(C, 0, x), x;
  }, t.replace = function(r, a, i) {
    var s = this.get(r), c = this.index.indexOf(s);
    s && this.remove(s);
    var u = i;
    return c !== -1 && (u = Z({}, i, {
      index: c
    })), this.add(r, a, u);
  }, t.get = function(r) {
    return this.map[r];
  }, t.remove = function(r) {
    this.unregister(r), delete this.raw[r.key], this.index.splice(this.index.indexOf(r), 1);
  }, t.indexOf = function(r) {
    return this.index.indexOf(r);
  }, t.process = function() {
    var r = this.options.jss.plugins;
    this.index.slice(0).forEach(r.onProcessRule, r);
  }, t.register = function(r) {
    this.map[r.key] = r, r instanceof Zs ? (this.map[r.selector] = r, r.id && (this.classes[r.key] = r.id)) : r instanceof el && this.keyframes && (this.keyframes[r.name] = r.id);
  }, t.unregister = function(r) {
    delete this.map[r.key], r instanceof Zs ? (delete this.map[r.selector], delete this.classes[r.key]) : r instanceof el && delete this.keyframes[r.name];
  }, t.update = function() {
    var r, a, i;
    if (typeof (arguments.length <= 0 ? void 0 : arguments[0]) == "string" ? (r = arguments.length <= 0 ? void 0 : arguments[0], a = arguments.length <= 1 ? void 0 : arguments[1], i = arguments.length <= 2 ? void 0 : arguments[2]) : (a = arguments.length <= 0 ? void 0 : arguments[0], i = arguments.length <= 1 ? void 0 : arguments[1], r = null), r)
      this.updateOne(this.get(r), a, i);
    else
      for (var s = 0; s < this.index.length; s++)
        this.updateOne(this.index[s], a, i);
  }, t.updateOne = function(r, a, i) {
    i === void 0 && (i = P1);
    var s = this.options, c = s.jss.plugins, u = s.sheet;
    if (r.rules instanceof e) {
      r.rules.update(a, i);
      return;
    }
    var p = r.style;
    if (c.onUpdate(a, r, u, i), i.process && p && p !== r.style) {
      c.onProcessStyle(r.style, r, u);
      for (var g in r.style) {
        var v = r.style[g], y = p[g];
        v !== y && r.prop(g, v, Cu);
      }
      for (var E in p) {
        var L = r.style[E], x = p[E];
        L == null && L !== x && r.prop(E, null, Cu);
      }
    }
  }, t.toString = function(r) {
    for (var a = "", i = this.options.sheet, s = i ? i.options.link : !1, c = ga(r), u = c.linebreak, p = 0; p < this.index.length; p++) {
      var g = this.index[p], v = g.toString(r);
      !v && !s || (a && (a += u), a += v);
    }
    return a;
  }, e;
}(), Qf = /* @__PURE__ */ function() {
  function e(n, r) {
    this.attached = !1, this.deployed = !1, this.classes = {}, this.keyframes = {}, this.options = Z({}, r, {
      sheet: this,
      parent: this,
      classes: this.classes,
      keyframes: this.keyframes
    }), r.Renderer && (this.renderer = new r.Renderer(this)), this.rules = new Eo(this.options);
    for (var a in n)
      this.rules.add(a, n[a]);
    this.rules.process();
  }
  var t = e.prototype;
  return t.attach = function() {
    return this.attached ? this : (this.renderer && this.renderer.attach(), this.attached = !0, this.deployed || this.deploy(), this);
  }, t.detach = function() {
    return this.attached ? (this.renderer && this.renderer.detach(), this.attached = !1, this) : this;
  }, t.addRule = function(r, a, i) {
    var s = this.queue;
    this.attached && !s && (this.queue = []);
    var c = this.rules.add(r, a, i);
    return c ? (this.options.jss.plugins.onProcessRule(c), this.attached ? (this.deployed && (s ? s.push(c) : (this.insertRule(c), this.queue && (this.queue.forEach(this.insertRule, this), this.queue = void 0))), c) : (this.deployed = !1, c)) : null;
  }, t.replaceRule = function(r, a, i) {
    var s = this.rules.get(r);
    if (!s) return this.addRule(r, a, i);
    var c = this.rules.replace(r, a, i);
    return c && this.options.jss.plugins.onProcessRule(c), this.attached ? (this.deployed && this.renderer && (c ? s.renderable && this.renderer.replaceRule(s.renderable, c) : this.renderer.deleteRule(s)), c) : (this.deployed = !1, c);
  }, t.insertRule = function(r) {
    this.renderer && this.renderer.insertRule(r);
  }, t.addRules = function(r, a) {
    var i = [];
    for (var s in r) {
      var c = this.addRule(s, r[s], a);
      c && i.push(c);
    }
    return i;
  }, t.getRule = function(r) {
    return this.rules.get(r);
  }, t.deleteRule = function(r) {
    var a = typeof r == "object" ? r : this.rules.get(r);
    return !a || // Style sheet was created without link: true and attached, in this case we
    // won't be able to remove the CSS rule from the DOM.
    this.attached && !a.renderable ? !1 : (this.rules.remove(a), this.attached && a.renderable && this.renderer ? this.renderer.deleteRule(a.renderable) : !0);
  }, t.indexOf = function(r) {
    return this.rules.indexOf(r);
  }, t.deploy = function() {
    return this.renderer && this.renderer.deploy(), this.deployed = !0, this;
  }, t.update = function() {
    var r;
    return (r = this.rules).update.apply(r, arguments), this;
  }, t.updateOne = function(r, a, i) {
    return this.rules.updateOne(r, a, i), this;
  }, t.toString = function(r) {
    return this.rules.toString(r);
  }, e;
}(), N1 = /* @__PURE__ */ function() {
  function e() {
    this.plugins = {
      internal: [],
      external: []
    }, this.registry = {};
  }
  var t = e.prototype;
  return t.onCreateRule = function(r, a, i) {
    for (var s = 0; s < this.registry.onCreateRule.length; s++) {
      var c = this.registry.onCreateRule[s](r, a, i);
      if (c) return c;
    }
    return null;
  }, t.onProcessRule = function(r) {
    if (!r.isProcessed) {
      for (var a = r.options.sheet, i = 0; i < this.registry.onProcessRule.length; i++)
        this.registry.onProcessRule[i](r, a);
      r.style && this.onProcessStyle(r.style, r, a), r.isProcessed = !0;
    }
  }, t.onProcessStyle = function(r, a, i) {
    for (var s = 0; s < this.registry.onProcessStyle.length; s++)
      a.style = this.registry.onProcessStyle[s](a.style, a, i);
  }, t.onProcessSheet = function(r) {
    for (var a = 0; a < this.registry.onProcessSheet.length; a++)
      this.registry.onProcessSheet[a](r);
  }, t.onUpdate = function(r, a, i, s) {
    for (var c = 0; c < this.registry.onUpdate.length; c++)
      this.registry.onUpdate[c](r, a, i, s);
  }, t.onChangeValue = function(r, a, i) {
    for (var s = r, c = 0; c < this.registry.onChangeValue.length; c++)
      s = this.registry.onChangeValue[c](s, a, i);
    return s;
  }, t.use = function(r, a) {
    a === void 0 && (a = {
      queue: "external"
    });
    var i = this.plugins[a.queue];
    i.indexOf(r) === -1 && (i.push(r), this.registry = [].concat(this.plugins.external, this.plugins.internal).reduce(function(s, c) {
      for (var u in c)
        u in s && s[u].push(c[u]);
      return s;
    }, {
      onCreateRule: [],
      onProcessRule: [],
      onProcessStyle: [],
      onProcessSheet: [],
      onChangeValue: [],
      onUpdate: []
    }));
  }, e;
}(), R1 = /* @__PURE__ */ function() {
  function e() {
    this.registry = [];
  }
  var t = e.prototype;
  return t.add = function(r) {
    var a = this.registry, i = r.options.index;
    if (a.indexOf(r) === -1) {
      if (a.length === 0 || i >= this.index) {
        a.push(r);
        return;
      }
      for (var s = 0; s < a.length; s++)
        if (a[s].options.index > i) {
          a.splice(s, 0, r);
          return;
        }
    }
  }, t.reset = function() {
    this.registry = [];
  }, t.remove = function(r) {
    var a = this.registry.indexOf(r);
    this.registry.splice(a, 1);
  }, t.toString = function(r) {
    for (var a = r === void 0 ? {} : r, i = a.attached, s = vn(a, ["attached"]), c = ga(s), u = c.linebreak, p = "", g = 0; g < this.registry.length; g++) {
      var v = this.registry[g];
      i != null && v.attached !== i || (p && (p += u), p += v.toString(s));
    }
    return p;
  }, kl(e, [{
    key: "index",
    /**
     * Current highest index number.
     */
    get: function() {
      return this.registry.length === 0 ? 0 : this.registry[this.registry.length - 1].options.index;
    }
  }]), e;
}(), Fa = new R1(), nl = typeof globalThis < "u" ? globalThis : typeof window < "u" && window.Math === Math ? window : typeof self < "u" && self.Math === Math ? self : Function("return this")(), rl = "2f1acc6c3a606b082e5eef5e54414ffb";
nl[rl] == null && (nl[rl] = 0);
var Su = nl[rl]++, Tu = function(t) {
  t === void 0 && (t = {});
  var n = 0, r = function(i, s) {
    n += 1;
    var c = "", u = "";
    return s && (s.options.classNamePrefix && (u = s.options.classNamePrefix), s.options.jss.id != null && (c = String(s.options.jss.id))), t.minify ? "" + (u || "c") + Su + c + n : u + i.key + "-" + Su + (c ? "-" + c : "") + "-" + n;
  };
  return r;
}, Xf = function(t) {
  var n;
  return function() {
    return n || (n = t()), n;
  };
}, I1 = function(t, n) {
  try {
    return t.attributeStyleMap ? t.attributeStyleMap.get(n) : t.style.getPropertyValue(n);
  } catch {
    return "";
  }
}, A1 = function(t, n, r) {
  try {
    var a = r;
    if (Array.isArray(r) && (a = _r(r)), t.attributeStyleMap)
      t.attributeStyleMap.set(n, a);
    else {
      var i = a ? a.indexOf("!important") : -1, s = i > -1 ? a.substr(0, i - 1) : a;
      t.style.setProperty(n, s, i > -1 ? "important" : "");
    }
  } catch {
    return !1;
  }
  return !0;
}, O1 = function(t, n) {
  try {
    t.attributeStyleMap ? t.attributeStyleMap.delete(n) : t.style.removeProperty(n);
  } catch {
  }
}, M1 = function(t, n) {
  return t.selectorText = n, t.selectorText === n;
}, Zf = Xf(function() {
  return document.querySelector("head");
});
function $1(e, t) {
  for (var n = 0; n < e.length; n++) {
    var r = e[n];
    if (r.attached && r.options.index > t.index && r.options.insertionPoint === t.insertionPoint)
      return r;
  }
  return null;
}
function F1(e, t) {
  for (var n = e.length - 1; n >= 0; n--) {
    var r = e[n];
    if (r.attached && r.options.insertionPoint === t.insertionPoint)
      return r;
  }
  return null;
}
function _1(e) {
  for (var t = Zf(), n = 0; n < t.childNodes.length; n++) {
    var r = t.childNodes[n];
    if (r.nodeType === 8 && r.nodeValue.trim() === e)
      return r;
  }
  return null;
}
function j1(e) {
  var t = Fa.registry;
  if (t.length > 0) {
    var n = $1(t, e);
    if (n && n.renderer)
      return {
        parent: n.renderer.element.parentNode,
        node: n.renderer.element
      };
    if (n = F1(t, e), n && n.renderer)
      return {
        parent: n.renderer.element.parentNode,
        node: n.renderer.element.nextSibling
      };
  }
  var r = e.insertionPoint;
  if (r && typeof r == "string") {
    var a = _1(r);
    if (a)
      return {
        parent: a.parentNode,
        node: a.nextSibling
      };
  }
  return !1;
}
function V1(e, t) {
  var n = t.insertionPoint, r = j1(t);
  if (r !== !1 && r.parent) {
    r.parent.insertBefore(e, r.node);
    return;
  }
  if (n && typeof n.nodeType == "number") {
    var a = n, i = a.parentNode;
    i && i.insertBefore(e, a.nextSibling);
    return;
  }
  Zf().appendChild(e);
}
var U1 = Xf(function() {
  var e = document.querySelector('meta[property="csp-nonce"]');
  return e ? e.getAttribute("content") : null;
}), Du = function(t, n, r) {
  try {
    "insertRule" in t ? t.insertRule(n, r) : "appendRule" in t && t.appendRule(n);
  } catch {
    return !1;
  }
  return t.cssRules[r];
}, ku = function(t, n) {
  var r = t.cssRules.length;
  return n === void 0 || n > r ? r : n;
}, B1 = function() {
  var t = document.createElement("style");
  return t.textContent = `
`, t;
}, H1 = /* @__PURE__ */ function() {
  function e(n) {
    this.getPropertyValue = I1, this.setProperty = A1, this.removeProperty = O1, this.setSelector = M1, this.hasInsertedRules = !1, this.cssRules = [], n && Fa.add(n), this.sheet = n;
    var r = this.sheet ? this.sheet.options : {}, a = r.media, i = r.meta, s = r.element;
    this.element = s || B1(), this.element.setAttribute("data-jss", ""), a && this.element.setAttribute("media", a), i && this.element.setAttribute("data-meta", i);
    var c = U1();
    c && this.element.setAttribute("nonce", c);
  }
  var t = e.prototype;
  return t.attach = function() {
    if (!(this.element.parentNode || !this.sheet)) {
      V1(this.element, this.sheet.options);
      var r = !!(this.sheet && this.sheet.deployed);
      this.hasInsertedRules && r && (this.hasInsertedRules = !1, this.deploy());
    }
  }, t.detach = function() {
    if (this.sheet) {
      var r = this.element.parentNode;
      r && r.removeChild(this.element), this.sheet.options.link && (this.cssRules = [], this.element.textContent = `
`);
    }
  }, t.deploy = function() {
    var r = this.sheet;
    if (r) {
      if (r.options.link) {
        this.insertRules(r.rules);
        return;
      }
      this.element.textContent = `
` + r.toString() + `
`;
    }
  }, t.insertRules = function(r, a) {
    for (var i = 0; i < r.index.length; i++)
      this.insertRule(r.index[i], i, a);
  }, t.insertRule = function(r, a, i) {
    if (i === void 0 && (i = this.element.sheet), r.rules) {
      var s = r, c = i;
      if (r.type === "conditional" || r.type === "keyframes") {
        var u = ku(i, a);
        if (c = Du(i, s.toString({
          children: !1
        }), u), c === !1)
          return !1;
        this.refCssRule(r, u, c);
      }
      return this.insertRules(s.rules, c), c;
    }
    var p = r.toString();
    if (!p) return !1;
    var g = ku(i, a), v = Du(i, p, g);
    return v === !1 ? !1 : (this.hasInsertedRules = !0, this.refCssRule(r, g, v), v);
  }, t.refCssRule = function(r, a, i) {
    r.renderable = i, r.options.parent instanceof Qf && this.cssRules.splice(a, 0, i);
  }, t.deleteRule = function(r) {
    var a = this.element.sheet, i = this.indexOf(r);
    return i === -1 ? !1 : (a.deleteRule(i), this.cssRules.splice(i, 1), !0);
  }, t.indexOf = function(r) {
    return this.cssRules.indexOf(r);
  }, t.replaceRule = function(r, a) {
    var i = this.indexOf(r);
    return i === -1 ? !1 : (this.element.sheet.deleteRule(i), this.cssRules.splice(i, 1), this.insertRule(a, i));
  }, t.getRules = function() {
    return this.element.sheet.cssRules;
  }, e;
}(), z1 = 0, q1 = /* @__PURE__ */ function() {
  function e(n) {
    this.id = z1++, this.version = "10.10.0", this.plugins = new N1(), this.options = {
      id: {
        minify: !1
      },
      createGenerateId: Tu,
      Renderer: Ya ? H1 : null,
      plugins: []
    }, this.generateId = Tu({
      minify: !1
    });
    for (var r = 0; r < Lu.length; r++)
      this.plugins.use(Lu[r], {
        queue: "internal"
      });
    this.setup(n);
  }
  var t = e.prototype;
  return t.setup = function(r) {
    return r === void 0 && (r = {}), r.createGenerateId && (this.options.createGenerateId = r.createGenerateId), r.id && (this.options.id = Z({}, this.options.id, r.id)), (r.createGenerateId || r.id) && (this.generateId = this.options.createGenerateId(this.options.id)), r.insertionPoint != null && (this.options.insertionPoint = r.insertionPoint), "Renderer" in r && (this.options.Renderer = r.Renderer), r.plugins && this.use.apply(this, r.plugins), this;
  }, t.createStyleSheet = function(r, a) {
    a === void 0 && (a = {});
    var i = a, s = i.index;
    typeof s != "number" && (s = Fa.index === 0 ? 0 : Fa.index + 1);
    var c = new Qf(r, Z({}, a, {
      jss: this,
      generateId: a.generateId || this.generateId,
      insertionPoint: this.options.insertionPoint,
      Renderer: this.options.Renderer,
      index: s
    }));
    return this.plugins.onProcessSheet(c), c;
  }, t.removeStyleSheet = function(r) {
    return r.detach(), Fa.remove(r), this;
  }, t.createRule = function(r, a, i) {
    if (a === void 0 && (a = {}), i === void 0 && (i = {}), typeof r == "object")
      return this.createRule(void 0, r, a);
    var s = Z({}, i, {
      name: r,
      jss: this,
      Renderer: this.options.Renderer
    });
    s.generateId || (s.generateId = this.generateId), s.classes || (s.classes = {}), s.keyframes || (s.keyframes = {});
    var c = ql(r, a, s);
    return c && this.plugins.onProcessRule(c), c;
  }, t.use = function() {
    for (var r = this, a = arguments.length, i = new Array(a), s = 0; s < a; s++)
      i[s] = arguments[s];
    return i.forEach(function(c) {
      r.plugins.use(c);
    }), this;
  }, e;
}(), ep = function(t) {
  return new q1(t);
}, Yl = typeof CSS == "object" && CSS != null && "number" in CSS;
function tp(e) {
  var t = null;
  for (var n in e) {
    var r = e[n], a = typeof r;
    if (a === "function")
      t || (t = {}), t[n] = r;
    else if (a === "object" && r !== null && !Array.isArray(r)) {
      var i = tp(r);
      i && (t || (t = {}), t[n] = i);
    }
  }
  return t;
}
/**
 * A better abstraction over CSS.
 *
 * @copyright Oleg Isonen (Slobodskoi) / Isonen 2014-present
 * @website https://github.com/cssinjs/jss
 * @license MIT
 */
ep();
var np = Date.now(), fs = "fnValues" + np, ps = "fnStyle" + ++np, W1 = function() {
  return {
    onCreateRule: function(n, r, a) {
      if (typeof r != "function") return null;
      var i = ql(n, {}, a);
      return i[ps] = r, i;
    },
    onProcessStyle: function(n, r) {
      if (fs in r || ps in r) return n;
      var a = {};
      for (var i in n) {
        var s = n[i];
        typeof s == "function" && (delete n[i], a[i] = s);
      }
      return r[fs] = a, n;
    },
    onUpdate: function(n, r, a, i) {
      var s = r, c = s[ps];
      c && (s.style = c(n) || {});
      var u = s[fs];
      if (u)
        for (var p in u)
          s.prop(p, u[p](n), i);
    }
  };
}, Er = "@global", al = "@global ", Y1 = /* @__PURE__ */ function() {
  function e(n, r, a) {
    this.type = "global", this.at = Er, this.isProcessed = !1, this.key = n, this.options = a, this.rules = new Eo(Z({}, a, {
      parent: this
    }));
    for (var i in r)
      this.rules.add(i, r[i]);
    this.rules.process();
  }
  var t = e.prototype;
  return t.getRule = function(r) {
    return this.rules.get(r);
  }, t.addRule = function(r, a, i) {
    var s = this.rules.add(r, a, i);
    return s && this.options.jss.plugins.onProcessRule(s), s;
  }, t.replaceRule = function(r, a, i) {
    var s = this.rules.replace(r, a, i);
    return s && this.options.jss.plugins.onProcessRule(s), s;
  }, t.indexOf = function(r) {
    return this.rules.indexOf(r);
  }, t.toString = function(r) {
    return this.rules.toString(r);
  }, e;
}(), G1 = /* @__PURE__ */ function() {
  function e(n, r, a) {
    this.type = "global", this.at = Er, this.isProcessed = !1, this.key = n, this.options = a;
    var i = n.substr(al.length);
    this.rule = a.jss.createRule(i, r, Z({}, a, {
      parent: this
    }));
  }
  var t = e.prototype;
  return t.toString = function(r) {
    return this.rule ? this.rule.toString(r) : "";
  }, e;
}(), K1 = /\s*,\s*/g;
function rp(e, t) {
  for (var n = e.split(K1), r = "", a = 0; a < n.length; a++)
    r += t + " " + n[a].trim(), n[a + 1] && (r += ", ");
  return r;
}
function J1(e, t) {
  var n = e.options, r = e.style, a = r ? r[Er] : null;
  if (a) {
    for (var i in a)
      t.addRule(i, a[i], Z({}, n, {
        selector: rp(i, e.selector)
      }));
    delete r[Er];
  }
}
function Q1(e, t) {
  var n = e.options, r = e.style;
  for (var a in r)
    if (!(a[0] !== "@" || a.substr(0, Er.length) !== Er)) {
      var i = rp(a.substr(Er.length), e.selector);
      t.addRule(i, r[a], Z({}, n, {
        selector: i
      })), delete r[a];
    }
}
function X1() {
  function e(n, r, a) {
    if (!n) return null;
    if (n === Er)
      return new Y1(n, r, a);
    if (n[0] === "@" && n.substr(0, al.length) === al)
      return new G1(n, r, a);
    var i = a.parent;
    return i && (i.type === "global" || i.options.parent && i.options.parent.type === "global") && (a.scoped = !1), !a.selector && a.scoped === !1 && (a.selector = n), null;
  }
  function t(n, r) {
    n.type !== "style" || !r || (J1(n, r), Q1(n, r));
  }
  return {
    onCreateRule: e,
    onProcessRule: t
  };
}
var Pu = /\s*,\s*/g, Z1 = /&/g, eL = /\$([\w-]+)/g;
function tL() {
  function e(a, i) {
    return function(s, c) {
      var u = a.getRule(c) || i && i.getRule(c);
      return u ? u.selector : c;
    };
  }
  function t(a, i) {
    for (var s = i.split(Pu), c = a.split(Pu), u = "", p = 0; p < s.length; p++)
      for (var g = s[p], v = 0; v < c.length; v++) {
        var y = c[v];
        u && (u += ", "), u += y.indexOf("&") !== -1 ? y.replace(Z1, g) : g + " " + y;
      }
    return u;
  }
  function n(a, i, s) {
    if (s) return Z({}, s, {
      index: s.index + 1
    });
    var c = a.options.nestingLevel;
    c = c === void 0 ? 1 : c + 1;
    var u = Z({}, a.options, {
      nestingLevel: c,
      index: i.indexOf(a) + 1
      // We don't need the parent name to be set options for chlid.
    });
    return delete u.name, u;
  }
  function r(a, i, s) {
    if (i.type !== "style") return a;
    var c = i, u = c.options.parent, p, g;
    for (var v in a) {
      var y = v.indexOf("&") !== -1, E = v[0] === "@";
      if (!(!y && !E)) {
        if (p = n(c, u, p), y) {
          var L = t(v, c.selector);
          g || (g = e(u, s)), L = L.replace(eL, g);
          var x = c.key + "-" + v;
          "replaceRule" in u ? u.replaceRule(x, a[v], Z({}, p, {
            selector: L
          })) : u.addRule(x, a[v], Z({}, p, {
            selector: L
          }));
        } else E && u.addRule(v, {}, p).addRule(c.key, a[v], {
          selector: c.selector
        });
        delete a[v];
      }
    }
    return a;
  }
  return {
    onProcessStyle: r
  };
}
var nL = /[A-Z]/g, rL = /^ms-/, ms = {};
function aL(e) {
  return "-" + e.toLowerCase();
}
function ap(e) {
  if (ms.hasOwnProperty(e))
    return ms[e];
  var t = e.replace(nL, aL);
  return ms[e] = rL.test(t) ? "-" + t : t;
}
function Wi(e) {
  var t = {};
  for (var n in e) {
    var r = n.indexOf("--") === 0 ? n : ap(n);
    t[r] = e[n];
  }
  return e.fallbacks && (Array.isArray(e.fallbacks) ? t.fallbacks = e.fallbacks.map(Wi) : t.fallbacks = Wi(e.fallbacks)), t;
}
function iL() {
  function e(n) {
    if (Array.isArray(n)) {
      for (var r = 0; r < n.length; r++)
        n[r] = Wi(n[r]);
      return n;
    }
    return Wi(n);
  }
  function t(n, r, a) {
    if (r.indexOf("--") === 0)
      return n;
    var i = ap(r);
    return r === i ? n : (a.prop(i, n), null);
  }
  return {
    onProcessStyle: e,
    onChangeValue: t
  };
}
var X = Yl && CSS ? CSS.px : "px", yi = Yl && CSS ? CSS.ms : "ms", ea = Yl && CSS ? CSS.percent : "%", oL = {
  // Animation properties
  "animation-delay": yi,
  "animation-duration": yi,
  // Background properties
  "background-position": X,
  "background-position-x": X,
  "background-position-y": X,
  "background-size": X,
  // Border Properties
  border: X,
  "border-bottom": X,
  "border-bottom-left-radius": X,
  "border-bottom-right-radius": X,
  "border-bottom-width": X,
  "border-left": X,
  "border-left-width": X,
  "border-radius": X,
  "border-right": X,
  "border-right-width": X,
  "border-top": X,
  "border-top-left-radius": X,
  "border-top-right-radius": X,
  "border-top-width": X,
  "border-width": X,
  "border-block": X,
  "border-block-end": X,
  "border-block-end-width": X,
  "border-block-start": X,
  "border-block-start-width": X,
  "border-block-width": X,
  "border-inline": X,
  "border-inline-end": X,
  "border-inline-end-width": X,
  "border-inline-start": X,
  "border-inline-start-width": X,
  "border-inline-width": X,
  "border-start-start-radius": X,
  "border-start-end-radius": X,
  "border-end-start-radius": X,
  "border-end-end-radius": X,
  // Margin properties
  margin: X,
  "margin-bottom": X,
  "margin-left": X,
  "margin-right": X,
  "margin-top": X,
  "margin-block": X,
  "margin-block-end": X,
  "margin-block-start": X,
  "margin-inline": X,
  "margin-inline-end": X,
  "margin-inline-start": X,
  // Padding properties
  padding: X,
  "padding-bottom": X,
  "padding-left": X,
  "padding-right": X,
  "padding-top": X,
  "padding-block": X,
  "padding-block-end": X,
  "padding-block-start": X,
  "padding-inline": X,
  "padding-inline-end": X,
  "padding-inline-start": X,
  // Mask properties
  "mask-position-x": X,
  "mask-position-y": X,
  "mask-size": X,
  // Width and height properties
  height: X,
  width: X,
  "min-height": X,
  "max-height": X,
  "min-width": X,
  "max-width": X,
  // Position properties
  bottom: X,
  left: X,
  top: X,
  right: X,
  inset: X,
  "inset-block": X,
  "inset-block-end": X,
  "inset-block-start": X,
  "inset-inline": X,
  "inset-inline-end": X,
  "inset-inline-start": X,
  // Shadow properties
  "box-shadow": X,
  "text-shadow": X,
  // Column properties
  "column-gap": X,
  "column-rule": X,
  "column-rule-width": X,
  "column-width": X,
  // Font and text properties
  "font-size": X,
  "font-size-delta": X,
  "letter-spacing": X,
  "text-decoration-thickness": X,
  "text-indent": X,
  "text-stroke": X,
  "text-stroke-width": X,
  "word-spacing": X,
  // Motion properties
  motion: X,
  "motion-offset": X,
  // Outline properties
  outline: X,
  "outline-offset": X,
  "outline-width": X,
  // Perspective properties
  perspective: X,
  "perspective-origin-x": ea,
  "perspective-origin-y": ea,
  // Transform properties
  "transform-origin": ea,
  "transform-origin-x": ea,
  "transform-origin-y": ea,
  "transform-origin-z": ea,
  // Transition properties
  "transition-delay": yi,
  "transition-duration": yi,
  // Alignment properties
  "vertical-align": X,
  "flex-basis": X,
  // Some random properties
  "shape-margin": X,
  size: X,
  gap: X,
  // Grid properties
  grid: X,
  "grid-gap": X,
  "row-gap": X,
  "grid-row-gap": X,
  "grid-column-gap": X,
  "grid-template-rows": X,
  "grid-template-columns": X,
  "grid-auto-rows": X,
  "grid-auto-columns": X,
  // Not existing properties.
  // Used to avoid issues with jss-plugin-expand integration.
  "box-shadow-x": X,
  "box-shadow-y": X,
  "box-shadow-blur": X,
  "box-shadow-spread": X,
  "font-line-height": X,
  "text-shadow-x": X,
  "text-shadow-y": X,
  "text-shadow-blur": X
};
function ip(e) {
  var t = /(-[a-z])/g, n = function(s) {
    return s[1].toUpperCase();
  }, r = {};
  for (var a in e)
    r[a] = e[a], r[a.replace(t, n)] = e[a];
  return r;
}
var sL = ip(oL);
function _a(e, t, n) {
  if (t == null) return t;
  if (Array.isArray(t))
    for (var r = 0; r < t.length; r++)
      t[r] = _a(e, t[r], n);
  else if (typeof t == "object")
    if (e === "fallbacks")
      for (var a in t)
        t[a] = _a(a, t[a], n);
    else
      for (var i in t)
        t[i] = _a(e + "-" + i, t[i], n);
  else if (typeof t == "number" && isNaN(t) === !1) {
    var s = n[e] || sL[e];
    return s && !(t === 0 && s === X) ? typeof s == "function" ? s(t).toString() : "" + t + s : t.toString();
  }
  return t;
}
function lL(e) {
  e === void 0 && (e = {});
  var t = ip(e);
  function n(a, i) {
    if (i.type !== "style") return a;
    for (var s in a)
      a[s] = _a(s, a[s], t);
    return a;
  }
  function r(a, i) {
    return _a(i, a, t);
  }
  return {
    onProcessStyle: n,
    onChangeValue: r
  };
}
var Oa = "", il = "", op = "", sp = "", cL = Ya && "ontouchstart" in document.documentElement;
if (Ya) {
  var gs = {
    Moz: "-moz-",
    ms: "-ms-",
    O: "-o-",
    Webkit: "-webkit-"
  }, uL = document.createElement("p"), hs = uL.style, dL = "Transform";
  for (var vs in gs)
    if (vs + dL in hs) {
      Oa = vs, il = gs[vs];
      break;
    }
  Oa === "Webkit" && "msHyphens" in hs && (Oa = "ms", il = gs.ms, sp = "edge"), Oa === "Webkit" && "-apple-trailing-word" in hs && (op = "apple");
}
var tt = {
  js: Oa,
  css: il,
  vendor: op,
  browser: sp,
  isTouch: cL
};
function fL(e) {
  return e[1] === "-" || tt.js === "ms" ? e : "@" + tt.css + "keyframes" + e.substr(10);
}
var pL = {
  noPrefill: ["appearance"],
  supportedProperty: function(t) {
    return t !== "appearance" ? !1 : tt.js === "ms" ? "-webkit-" + t : tt.css + t;
  }
}, mL = {
  noPrefill: ["color-adjust"],
  supportedProperty: function(t) {
    return t !== "color-adjust" ? !1 : tt.js === "Webkit" ? tt.css + "print-" + t : t;
  }
}, gL = /[-\s]+(.)?/g;
function hL(e, t) {
  return t ? t.toUpperCase() : "";
}
function Gl(e) {
  return e.replace(gL, hL);
}
function Tr(e) {
  return Gl("-" + e);
}
var vL = {
  noPrefill: ["mask"],
  supportedProperty: function(t, n) {
    if (!/^mask/.test(t)) return !1;
    if (tt.js === "Webkit") {
      var r = "mask-image";
      if (Gl(r) in n)
        return t;
      if (tt.js + Tr(r) in n)
        return tt.css + t;
    }
    return t;
  }
}, yL = {
  noPrefill: ["text-orientation"],
  supportedProperty: function(t) {
    return t !== "text-orientation" ? !1 : tt.vendor === "apple" && !tt.isTouch ? tt.css + t : t;
  }
}, bL = {
  noPrefill: ["transform"],
  supportedProperty: function(t, n, r) {
    return t !== "transform" ? !1 : r.transform ? t : tt.css + t;
  }
}, wL = {
  noPrefill: ["transition"],
  supportedProperty: function(t, n, r) {
    return t !== "transition" ? !1 : r.transition ? t : tt.css + t;
  }
}, xL = {
  noPrefill: ["writing-mode"],
  supportedProperty: function(t) {
    return t !== "writing-mode" ? !1 : tt.js === "Webkit" || tt.js === "ms" && tt.browser !== "edge" ? tt.css + t : t;
  }
}, EL = {
  noPrefill: ["user-select"],
  supportedProperty: function(t) {
    return t !== "user-select" ? !1 : tt.js === "Moz" || tt.js === "ms" || tt.vendor === "apple" ? tt.css + t : t;
  }
}, LL = {
  supportedProperty: function(t, n) {
    if (!/^break-/.test(t)) return !1;
    if (tt.js === "Webkit") {
      var r = "WebkitColumn" + Tr(t);
      return r in n ? tt.css + "column-" + t : !1;
    }
    if (tt.js === "Moz") {
      var a = "page" + Tr(t);
      return a in n ? "page-" + t : !1;
    }
    return !1;
  }
}, CL = {
  supportedProperty: function(t, n) {
    if (!/^(border|margin|padding)-inline/.test(t)) return !1;
    if (tt.js === "Moz") return t;
    var r = t.replace("-inline", "");
    return tt.js + Tr(r) in n ? tt.css + r : !1;
  }
}, SL = {
  supportedProperty: function(t, n) {
    return Gl(t) in n ? t : !1;
  }
}, TL = {
  supportedProperty: function(t, n) {
    var r = Tr(t);
    return t[0] === "-" || t[0] === "-" && t[1] === "-" ? t : tt.js + r in n ? tt.css + t : tt.js !== "Webkit" && "Webkit" + r in n ? "-webkit-" + t : !1;
  }
}, DL = {
  supportedProperty: function(t) {
    return t.substring(0, 11) !== "scroll-snap" ? !1 : tt.js === "ms" ? "" + tt.css + t : t;
  }
}, kL = {
  supportedProperty: function(t) {
    return t !== "overscroll-behavior" ? !1 : tt.js === "ms" ? tt.css + "scroll-chaining" : t;
  }
}, PL = {
  "flex-grow": "flex-positive",
  "flex-shrink": "flex-negative",
  "flex-basis": "flex-preferred-size",
  "justify-content": "flex-pack",
  order: "flex-order",
  "align-items": "flex-align",
  "align-content": "flex-line-pack"
  // 'align-self' is handled by 'align-self' plugin.
}, NL = {
  supportedProperty: function(t, n) {
    var r = PL[t];
    return r && tt.js + Tr(r) in n ? tt.css + r : !1;
  }
}, lp = {
  flex: "box-flex",
  "flex-grow": "box-flex",
  "flex-direction": ["box-orient", "box-direction"],
  order: "box-ordinal-group",
  "align-items": "box-align",
  "flex-flow": ["box-orient", "box-direction"],
  "justify-content": "box-pack"
}, RL = Object.keys(lp), IL = function(t) {
  return tt.css + t;
}, AL = {
  supportedProperty: function(t, n, r) {
    var a = r.multiple;
    if (RL.indexOf(t) > -1) {
      var i = lp[t];
      if (!Array.isArray(i))
        return tt.js + Tr(i) in n ? tt.css + i : !1;
      if (!a) return !1;
      for (var s = 0; s < i.length; s++)
        if (!(tt.js + Tr(i[0]) in n))
          return !1;
      return i.map(IL);
    }
    return !1;
  }
}, cp = [pL, mL, vL, yL, bL, wL, xL, EL, LL, CL, SL, TL, DL, kL, NL, AL], Nu = cp.filter(function(e) {
  return e.supportedProperty;
}).map(function(e) {
  return e.supportedProperty;
}), OL = cp.filter(function(e) {
  return e.noPrefill;
}).reduce(function(e, t) {
  return e.push.apply(e, ro(t.noPrefill)), e;
}, []), Ma, $r = {};
if (Ya) {
  Ma = document.createElement("p");
  var ys = window.getComputedStyle(document.documentElement, "");
  for (var bs in ys)
    isNaN(bs) || ($r[ys[bs]] = ys[bs]);
  OL.forEach(function(e) {
    return delete $r[e];
  });
}
function ol(e, t) {
  if (t === void 0 && (t = {}), !Ma) return e;
  if ($r[e] != null)
    return $r[e];
  (e === "transition" || e === "transform") && (t[e] = e in Ma.style);
  for (var n = 0; n < Nu.length && ($r[e] = Nu[n](e, Ma.style, t), !$r[e]); n++)
    ;
  try {
    Ma.style[e] = "";
  } catch {
    return !1;
  }
  return $r[e];
}
var ta = {}, ML = {
  transition: 1,
  "transition-property": 1,
  "-webkit-transition": 1,
  "-webkit-transition-property": 1
}, $L = /(^\s*[\w-]+)|, (\s*[\w-]+)(?![^()]*\))/g, wr;
function FL(e, t, n) {
  if (t === "var") return "var";
  if (t === "all") return "all";
  if (n === "all") return ", all";
  var r = t ? ol(t) : ", " + ol(n);
  return r || t || n;
}
Ya && (wr = document.createElement("p"));
function Ru(e, t) {
  var n = t;
  if (!wr || e === "content") return t;
  if (typeof n != "string" || !isNaN(parseInt(n, 10)))
    return n;
  var r = e + n;
  if (ta[r] != null)
    return ta[r];
  try {
    wr.style[e] = n;
  } catch {
    return ta[r] = !1, !1;
  }
  if (ML[e])
    n = n.replace($L, FL);
  else if (wr.style[e] === "" && (n = tt.css + n, n === "-ms-flex" && (wr.style[e] = "-ms-flexbox"), wr.style[e] = n, wr.style[e] === ""))
    return ta[r] = !1, !1;
  return wr.style[e] = "", ta[r] = n, ta[r];
}
function _L() {
  function e(a) {
    if (a.type === "keyframes") {
      var i = a;
      i.at = fL(i.at);
    }
  }
  function t(a) {
    for (var i in a) {
      var s = a[i];
      if (i === "fallbacks" && Array.isArray(s)) {
        a[i] = s.map(t);
        continue;
      }
      var c = !1, u = ol(i);
      u && u !== i && (c = !0);
      var p = !1, g = Ru(u, _r(s));
      g && g !== s && (p = !0), (c || p) && (c && delete a[i], a[u || i] = g || s);
    }
    return a;
  }
  function n(a, i) {
    return i.type !== "style" ? a : t(a);
  }
  function r(a, i) {
    return Ru(i, _r(a)) || a;
  }
  return {
    onProcessRule: e,
    onProcessStyle: n,
    onChangeValue: r
  };
}
function jL() {
  var e = function(n, r) {
    return n.length === r.length ? n > r ? 1 : -1 : n.length - r.length;
  };
  return {
    onProcessStyle: function(n, r) {
      if (r.type !== "style") return n;
      for (var a = {}, i = Object.keys(n).sort(e), s = 0; s < i.length; s++)
        a[i[s]] = n[i[s]];
      return a;
    }
  };
}
function VL() {
  return {
    plugins: [
      W1(),
      X1(),
      tL(),
      iL(),
      lL(),
      // Disable the vendor prefixer server-side, it does nothing.
      // This way, we can get a performance boost.
      // In the documentation, we are using `autoprefixer` to solve this problem.
      typeof window > "u" ? null : _L(),
      jL()
    ]
  };
}
function up() {
  var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = e.baseClasses, n = e.newClasses;
  if (e.Component, !n)
    return t;
  var r = Z({}, t);
  return Object.keys(n).forEach(function(a) {
    n[a] && (r[a] = "".concat(t[a], " ").concat(n[a]));
  }), r;
}
var ra = {
  set: function(t, n, r, a) {
    var i = t.get(n);
    i || (i = /* @__PURE__ */ new Map(), t.set(n, i)), i.set(r, a);
  },
  get: function(t, n, r) {
    var a = t.get(n);
    return a ? a.get(r) : void 0;
  },
  delete: function(t, n, r) {
    var a = t.get(n);
    a.delete(r);
  }
}, UL = l.createContext(null);
function Lo() {
  var e = l.useContext(UL);
  return e;
}
var BL = ep(VL()), HL = o1(), zL = /* @__PURE__ */ new Map(), qL = {
  disableGeneration: !1,
  generateClassName: HL,
  jss: BL,
  sheetsCache: null,
  sheetsManager: zL,
  sheetsRegistry: null
}, WL = l.createContext(qL), Iu = -1e9;
function YL() {
  return Iu += 1, Iu;
}
var GL = {};
function KL(e) {
  var t = typeof e == "function";
  return {
    create: function(r, a) {
      var i;
      try {
        i = t ? e(r) : e;
      } catch (u) {
        throw u;
      }
      if (!a || !r.overrides || !r.overrides[a])
        return i;
      var s = r.overrides[a], c = Z({}, i);
      return Object.keys(s).forEach(function(u) {
        c[u] = Vr(c[u], s[u]);
      }), c;
    },
    options: {}
  };
}
function JL(e, t, n) {
  var r = e.state, a = e.stylesOptions;
  if (a.disableGeneration)
    return t || {};
  r.cacheClasses || (r.cacheClasses = {
    // Cache for the finalized classes value.
    value: null,
    // Cache for the last used classes prop pointer.
    lastProp: null,
    // Cache for the last used rendered classes pointer.
    lastJSS: {}
  });
  var i = !1;
  return r.classes !== r.cacheClasses.lastJSS && (r.cacheClasses.lastJSS = r.classes, i = !0), t !== r.cacheClasses.lastProp && (r.cacheClasses.lastProp = t, i = !0), i && (r.cacheClasses.value = up({
    baseClasses: r.cacheClasses.lastJSS,
    newClasses: t,
    Component: n
  })), r.cacheClasses.value;
}
function QL(e, t) {
  var n = e.state, r = e.theme, a = e.stylesOptions, i = e.stylesCreator, s = e.name;
  if (!a.disableGeneration) {
    var c = ra.get(a.sheetsManager, i, r);
    c || (c = {
      refs: 0,
      staticSheet: null,
      dynamicStyles: null
    }, ra.set(a.sheetsManager, i, r, c));
    var u = Z({}, i.options, a, {
      theme: r,
      flip: typeof a.flip == "boolean" ? a.flip : r.direction === "rtl"
    });
    u.generateId = u.serverGenerateClassName || u.generateClassName;
    var p = a.sheetsRegistry;
    if (c.refs === 0) {
      var g;
      a.sheetsCache && (g = ra.get(a.sheetsCache, i, r));
      var v = i.create(r, s);
      g || (g = a.jss.createStyleSheet(v, Z({
        link: !1
      }, u)), g.attach(), a.sheetsCache && ra.set(a.sheetsCache, i, r, g)), p && p.add(g), c.staticSheet = g, c.dynamicStyles = tp(v);
    }
    if (c.dynamicStyles) {
      var y = a.jss.createStyleSheet(c.dynamicStyles, Z({
        link: !0
      }, u));
      y.update(t), y.attach(), n.dynamicSheet = y, n.classes = up({
        baseClasses: c.staticSheet.classes,
        newClasses: y.classes
      }), p && p.add(y);
    } else
      n.classes = c.staticSheet.classes;
    c.refs += 1;
  }
}
function XL(e, t) {
  var n = e.state;
  n.dynamicSheet && n.dynamicSheet.update(t);
}
function ZL(e) {
  var t = e.state, n = e.theme, r = e.stylesOptions, a = e.stylesCreator;
  if (!r.disableGeneration) {
    var i = ra.get(r.sheetsManager, a, n);
    i.refs -= 1;
    var s = r.sheetsRegistry;
    i.refs === 0 && (ra.delete(r.sheetsManager, a, n), r.jss.removeStyleSheet(i.staticSheet), s && s.remove(i.staticSheet)), t.dynamicSheet && (r.jss.removeStyleSheet(t.dynamicSheet), s && s.remove(t.dynamicSheet));
  }
}
function eC(e, t) {
  var n = l.useRef([]), r, a = l.useMemo(function() {
    return {};
  }, t);
  n.current !== a && (n.current = a, r = e()), l.useEffect(
    function() {
      return function() {
        r && r();
      };
    },
    [a]
    // eslint-disable-line react-hooks/exhaustive-deps
  );
}
function tC(e) {
  var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = t.name, r = t.classNamePrefix, a = t.Component, i = t.defaultTheme, s = i === void 0 ? GL : i, c = Jt(t, ["name", "classNamePrefix", "Component", "defaultTheme"]), u = KL(e), p = n || r || "makeStyles";
  u.options = {
    index: YL(),
    name: n,
    meta: p,
    classNamePrefix: p
  };
  var g = function() {
    var y = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, E = Lo() || s, L = Z({}, l.useContext(WL), c), x = l.useRef(), C = l.useRef();
    eC(function() {
      var D = {
        name: n,
        state: {},
        stylesCreator: u,
        stylesOptions: L,
        theme: E
      };
      return QL(D, y), C.current = !1, x.current = D, function() {
        ZL(D);
      };
    }, [E, u]), l.useEffect(function() {
      C.current && XL(x.current, y), C.current = !0;
    });
    var T = JL(x.current, y.classes, a);
    return T;
  };
  return g;
}
var nC = function(t) {
  var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  return function(r) {
    var a = n.defaultTheme, i = n.withTheme, s = i === void 0 ? !1 : i, c = n.name, u = Jt(n, ["defaultTheme", "withTheme", "name"]), p = c, g = tC(t, Z({
      defaultTheme: a,
      Component: r,
      name: c || r.displayName,
      classNamePrefix: p
    }, u)), v = /* @__PURE__ */ l.forwardRef(function(E, L) {
      E.classes;
      var x = E.innerRef, C = Jt(E, ["classes", "innerRef"]), T = g(Z({}, r.defaultProps, E)), D, k = C;
      return (typeof c == "string" || s) && (D = Lo() || a, c && (k = s1({
        theme: D,
        name: c,
        props: C
      })), s && !k.theme && (k.theme = D)), /* @__PURE__ */ l.createElement(r, Z({
        ref: x || L,
        classes: T
      }, k));
    });
    return rx(v, r), v;
  };
}, br = ["xs", "sm", "md", "lg", "xl"];
function rC(e) {
  var t = e.values, n = t === void 0 ? {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920
  } : t, r = e.unit, a = r === void 0 ? "px" : r, i = e.step, s = i === void 0 ? 5 : i, c = Jt(e, ["values", "unit", "step"]);
  function u(E) {
    var L = typeof n[E] == "number" ? n[E] : E;
    return "@media (min-width:".concat(L).concat(a, ")");
  }
  function p(E) {
    var L = br.indexOf(E) + 1, x = n[br[L]];
    if (L === br.length)
      return u("xs");
    var C = typeof x == "number" && L > 0 ? x : E;
    return "@media (max-width:".concat(C - s / 100).concat(a, ")");
  }
  function g(E, L) {
    var x = br.indexOf(L);
    return x === br.length - 1 ? u(E) : "@media (min-width:".concat(typeof n[E] == "number" ? n[E] : E).concat(a, ") and ") + "(max-width:".concat((x !== -1 && typeof n[br[x + 1]] == "number" ? n[br[x + 1]] : L) - s / 100).concat(a, ")");
  }
  function v(E) {
    return g(E, E);
  }
  function y(E) {
    return n[E];
  }
  return Z({
    keys: br,
    values: n,
    up: u,
    down: p,
    between: g,
    only: v,
    width: y
  }, c);
}
function aC(e, t, n) {
  var r;
  return Z({
    gutters: function() {
      var i = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      return console.warn(["Material-UI: theme.mixins.gutters() is deprecated.", "You can use the source of the mixin directly:", `
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
      },
      `].join(`
`)), Z({
        paddingLeft: t(2),
        paddingRight: t(2)
      }, i, Mn({}, e.up("sm"), Z({
        paddingLeft: t(3),
        paddingRight: t(3)
      }, i[e.up("sm")])));
    },
    toolbar: (r = {
      minHeight: 56
    }, Mn(r, "".concat(e.up("xs"), " and (orientation: landscape)"), {
      minHeight: 48
    }), Mn(r, e.up("sm"), {
      minHeight: 64
    }), r)
  }, n);
}
var Yi = {
  black: "#000",
  white: "#fff"
}, Kl = {
  50: "#fafafa",
  100: "#f5f5f5",
  200: "#eeeeee",
  300: "#e0e0e0",
  400: "#bdbdbd",
  500: "#9e9e9e",
  600: "#757575",
  700: "#616161",
  800: "#424242",
  900: "#212121",
  A100: "#d5d5d5",
  A200: "#aaaaaa",
  A400: "#303030",
  A700: "#616161"
}, ws = {
  300: "#7986cb",
  500: "#3f51b5",
  700: "#303f9f"
}, xs = {
  A200: "#ff4081",
  A400: "#f50057",
  A700: "#c51162"
}, Es = {
  300: "#e57373",
  500: "#f44336",
  700: "#d32f2f"
}, Ls = {
  300: "#ffb74d",
  500: "#ff9800",
  700: "#f57c00"
}, Cs = {
  300: "#64b5f6",
  500: "#2196f3",
  700: "#1976d2"
}, Ss = {
  300: "#81c784",
  500: "#4caf50",
  700: "#388e3c"
}, Au = {
  // The colors used to style the text.
  text: {
    // The most important text.
    primary: "rgba(0, 0, 0, 0.87)",
    // Secondary text.
    secondary: "rgba(0, 0, 0, 0.54)",
    // Disabled text have even lower visual prominence.
    disabled: "rgba(0, 0, 0, 0.38)",
    // Text hints.
    hint: "rgba(0, 0, 0, 0.38)"
  },
  // The color used to divide different elements.
  divider: "rgba(0, 0, 0, 0.12)",
  // The background colors used to style the surfaces.
  // Consistency between these values is important.
  background: {
    paper: Yi.white,
    default: Kl[50]
  },
  // The colors used to style the action elements.
  action: {
    // The color of an active action like an icon button.
    active: "rgba(0, 0, 0, 0.54)",
    // The color of an hovered action.
    hover: "rgba(0, 0, 0, 0.04)",
    hoverOpacity: 0.04,
    // The color of a selected action.
    selected: "rgba(0, 0, 0, 0.08)",
    selectedOpacity: 0.08,
    // The color of a disabled action.
    disabled: "rgba(0, 0, 0, 0.26)",
    // The background color of a disabled action.
    disabledBackground: "rgba(0, 0, 0, 0.12)",
    disabledOpacity: 0.38,
    focus: "rgba(0, 0, 0, 0.12)",
    focusOpacity: 0.12,
    activatedOpacity: 0.12
  }
}, Ts = {
  text: {
    primary: Yi.white,
    secondary: "rgba(255, 255, 255, 0.7)",
    disabled: "rgba(255, 255, 255, 0.5)",
    hint: "rgba(255, 255, 255, 0.5)",
    icon: "rgba(255, 255, 255, 0.5)"
  },
  divider: "rgba(255, 255, 255, 0.12)",
  background: {
    paper: Kl[800],
    default: "#303030"
  },
  action: {
    active: Yi.white,
    hover: "rgba(255, 255, 255, 0.08)",
    hoverOpacity: 0.08,
    selected: "rgba(255, 255, 255, 0.16)",
    selectedOpacity: 0.16,
    disabled: "rgba(255, 255, 255, 0.3)",
    disabledBackground: "rgba(255, 255, 255, 0.12)",
    disabledOpacity: 0.38,
    focus: "rgba(255, 255, 255, 0.12)",
    focusOpacity: 0.12,
    activatedOpacity: 0.24
  }
};
function Ou(e, t, n, r) {
  var a = r.light || r, i = r.dark || r * 1.5;
  e[t] || (e.hasOwnProperty(n) ? e[t] = e[n] : t === "light" ? e.light = n1(e.main, a) : t === "dark" && (e.dark = t1(e.main, i)));
}
function iC(e) {
  var t = e.primary, n = t === void 0 ? {
    light: ws[300],
    main: ws[500],
    dark: ws[700]
  } : t, r = e.secondary, a = r === void 0 ? {
    light: xs.A200,
    main: xs.A400,
    dark: xs.A700
  } : r, i = e.error, s = i === void 0 ? {
    light: Es[300],
    main: Es[500],
    dark: Es[700]
  } : i, c = e.warning, u = c === void 0 ? {
    light: Ls[300],
    main: Ls[500],
    dark: Ls[700]
  } : c, p = e.info, g = p === void 0 ? {
    light: Cs[300],
    main: Cs[500],
    dark: Cs[700]
  } : p, v = e.success, y = v === void 0 ? {
    light: Ss[300],
    main: Ss[500],
    dark: Ss[700]
  } : v, E = e.type, L = E === void 0 ? "light" : E, x = e.contrastThreshold, C = x === void 0 ? 3 : x, T = e.tonalOffset, D = T === void 0 ? 0.2 : T, k = Jt(e, ["primary", "secondary", "error", "warning", "info", "success", "type", "contrastThreshold", "tonalOffset"]);
  function N(_) {
    var O = e1(_, Ts.text.primary) >= C ? Ts.text.primary : Au.text.primary;
    return O;
  }
  var R = function(O) {
    var J = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 500, ee = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 300, ge = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 700;
    if (O = Z({}, O), !O.main && O[J] && (O.main = O[J]), !O.main)
      throw new Error(qi(4, J));
    if (typeof O.main != "string")
      throw new Error(qi(5, JSON.stringify(O.main)));
    return Ou(O, "light", ee, D), Ou(O, "dark", ge, D), O.contrastText || (O.contrastText = N(O.main)), O;
  }, A = {
    dark: Ts,
    light: Au
  }, f = Vr(Z({
    // A collection of common colors.
    common: Yi,
    // The palette type, can be light or dark.
    type: L,
    // The colors used to represent primary interface elements for a user.
    primary: R(n),
    // The colors used to represent secondary interface elements for a user.
    secondary: R(a, "A400", "A200", "A700"),
    // The colors used to represent interface elements that the user should be made aware of.
    error: R(s),
    // The colors used to represent potentially dangerous actions or important messages.
    warning: R(u),
    // The colors used to present information to the user that is neutral and not necessarily important.
    info: R(g),
    // The colors used to indicate the successful completion of an action that user triggered.
    success: R(y),
    // The grey colors.
    grey: Kl,
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: C,
    // Takes a background color and returns the text color that maximizes the contrast.
    getContrastText: N,
    // Generate a rich color object.
    augmentColor: R,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: D
  }, A[L]), k);
  return f;
}
function dp(e) {
  return Math.round(e * 1e5) / 1e5;
}
function oC(e) {
  return dp(e);
}
var Mu = {
  textTransform: "uppercase"
}, $u = '"Roboto", "Helvetica", "Arial", sans-serif';
function sC(e, t) {
  var n = typeof t == "function" ? t(e) : t, r = n.fontFamily, a = r === void 0 ? $u : r, i = n.fontSize, s = i === void 0 ? 14 : i, c = n.fontWeightLight, u = c === void 0 ? 300 : c, p = n.fontWeightRegular, g = p === void 0 ? 400 : p, v = n.fontWeightMedium, y = v === void 0 ? 500 : v, E = n.fontWeightBold, L = E === void 0 ? 700 : E, x = n.htmlFontSize, C = x === void 0 ? 16 : x, T = n.allVariants, D = n.pxToRem, k = Jt(n, ["fontFamily", "fontSize", "fontWeightLight", "fontWeightRegular", "fontWeightMedium", "fontWeightBold", "htmlFontSize", "allVariants", "pxToRem"]), N = s / 14, R = D || function(_) {
    return "".concat(_ / C * N, "rem");
  }, A = function(O, J, ee, ge, ie) {
    return Z({
      fontFamily: a,
      fontWeight: O,
      fontSize: R(J),
      // Unitless following https://meyerweb.com/eric/thoughts/2006/02/08/unitless-line-heights/
      lineHeight: ee
    }, a === $u ? {
      letterSpacing: "".concat(dp(ge / J), "em")
    } : {}, ie, T);
  }, f = {
    h1: A(u, 96, 1.167, -1.5),
    h2: A(u, 60, 1.2, -0.5),
    h3: A(g, 48, 1.167, 0),
    h4: A(g, 34, 1.235, 0.25),
    h5: A(g, 24, 1.334, 0),
    h6: A(y, 20, 1.6, 0.15),
    subtitle1: A(g, 16, 1.75, 0.15),
    subtitle2: A(y, 14, 1.57, 0.1),
    body1: A(g, 16, 1.5, 0.15),
    body2: A(g, 14, 1.43, 0.15),
    button: A(y, 14, 1.75, 0.4, Mu),
    caption: A(g, 12, 1.66, 0.4),
    overline: A(g, 12, 2.66, 1, Mu)
  };
  return Vr(Z({
    htmlFontSize: C,
    pxToRem: R,
    round: oC,
    // TODO v5: remove
    fontFamily: a,
    fontSize: s,
    fontWeightLight: u,
    fontWeightRegular: g,
    fontWeightMedium: y,
    fontWeightBold: L
  }, f), k, {
    clone: !1
    // No need to clone deep
  });
}
var lC = 0.2, cC = 0.14, uC = 0.12;
function Mt() {
  return ["".concat(arguments.length <= 0 ? void 0 : arguments[0], "px ").concat(arguments.length <= 1 ? void 0 : arguments[1], "px ").concat(arguments.length <= 2 ? void 0 : arguments[2], "px ").concat(arguments.length <= 3 ? void 0 : arguments[3], "px rgba(0,0,0,").concat(lC, ")"), "".concat(arguments.length <= 4 ? void 0 : arguments[4], "px ").concat(arguments.length <= 5 ? void 0 : arguments[5], "px ").concat(arguments.length <= 6 ? void 0 : arguments[6], "px ").concat(arguments.length <= 7 ? void 0 : arguments[7], "px rgba(0,0,0,").concat(cC, ")"), "".concat(arguments.length <= 8 ? void 0 : arguments[8], "px ").concat(arguments.length <= 9 ? void 0 : arguments[9], "px ").concat(arguments.length <= 10 ? void 0 : arguments[10], "px ").concat(arguments.length <= 11 ? void 0 : arguments[11], "px rgba(0,0,0,").concat(uC, ")")].join(",");
}
var dC = ["none", Mt(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0), Mt(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0), Mt(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0), Mt(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0), Mt(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0), Mt(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0), Mt(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1), Mt(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2), Mt(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2), Mt(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3), Mt(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3), Mt(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4), Mt(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4), Mt(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4), Mt(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5), Mt(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5), Mt(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5), Mt(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6), Mt(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6), Mt(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7), Mt(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7), Mt(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7), Mt(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8), Mt(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8)], fC = {
  borderRadius: 4
};
function pC(e) {
  var t = e.spacing || 8;
  return typeof t == "number" ? function(n) {
    return t * n;
  } : Array.isArray(t) ? function(n) {
    return t[n];
  } : typeof t == "function" ? t : function() {
  };
}
function mC() {
  var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 8;
  if (e.mui)
    return e;
  var t = pC({
    spacing: e
  }), n = function() {
    for (var a = arguments.length, i = new Array(a), s = 0; s < a; s++)
      i[s] = arguments[s];
    return i.length === 0 ? t(1) : i.length === 1 ? t(i[0]) : i.map(function(c) {
      if (typeof c == "string")
        return c;
      var u = t(c);
      return typeof u == "number" ? "".concat(u, "px") : u;
    }).join(" ");
  };
  return Object.defineProperty(n, "unit", {
    get: function() {
      return e;
    }
  }), n.mui = !0, n;
}
var Fu = {
  // This is the most common easing curve.
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Objects enter the screen at full velocity from off-screen and
  // slowly decelerate to a resting point.
  easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
  // Objects leave the screen at full velocity. They do not decelerate when off-screen.
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  // The sharp curve is used by objects that may return to the screen at any time.
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)"
}, _u = {
  shortest: 150,
  shorter: 200,
  short: 250,
  // most basic recommended timing
  standard: 300,
  // this is to be used in complex animations
  complex: 375,
  // recommended when something is entering screen
  enteringScreen: 225,
  // recommended when something is leaving screen
  leavingScreen: 195
};
function ju(e) {
  return "".concat(Math.round(e), "ms");
}
const gC = {
  easing: Fu,
  duration: _u,
  create: function() {
    var t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : ["all"], n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, r = n.duration, a = r === void 0 ? _u.standard : r, i = n.easing, s = i === void 0 ? Fu.easeInOut : i, c = n.delay, u = c === void 0 ? 0 : c;
    return Jt(n, ["duration", "easing", "delay"]), (Array.isArray(t) ? t : [t]).map(function(p) {
      return "".concat(p, " ").concat(typeof a == "string" ? a : ju(a), " ").concat(s, " ").concat(typeof u == "string" ? u : ju(u));
    }).join(",");
  },
  getAutoHeightDuration: function(t) {
    if (!t)
      return 0;
    var n = t / 36;
    return Math.round((4 + 15 * Math.pow(n, 0.25) + n / 5) * 10);
  }
};
var hC = {
  mobileStepper: 1e3,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500
};
function vC() {
  for (var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, t = e.breakpoints, n = t === void 0 ? {} : t, r = e.mixins, a = r === void 0 ? {} : r, i = e.palette, s = i === void 0 ? {} : i, c = e.spacing, u = e.typography, p = u === void 0 ? {} : u, g = Jt(e, ["breakpoints", "mixins", "palette", "spacing", "typography"]), v = iC(s), y = rC(n), E = mC(c), L = Vr({
    breakpoints: y,
    direction: "ltr",
    mixins: aC(y, E, a),
    overrides: {},
    // Inject custom styles
    palette: v,
    props: {},
    // Provide default props
    shadows: dC,
    typography: sC(v, p),
    spacing: E,
    shape: fC,
    transitions: gC,
    zIndex: hC
  }, g), x = arguments.length, C = new Array(x > 1 ? x - 1 : 0), T = 1; T < x; T++)
    C[T - 1] = arguments[T];
  return L = C.reduce(function(D, k) {
    return Vr(D, k);
  }, L), L;
}
var fp = vC();
function yC(e, t) {
  return nC(e, Z({
    defaultTheme: fp
  }, t));
}
function bC(e) {
  if (typeof e != "string")
    throw new Error(qi(7));
  return e.charAt(0).toUpperCase() + e.slice(1);
}
const Vu = {
  disabled: !1
}, pp = l.createContext(null);
var wC = function(t) {
  return t.scrollTop;
}, $a = "unmounted", Or = "exited", xr = "entering", Fr = "entered", sl = "exiting", nr = /* @__PURE__ */ function(e) {
  xo(t, e);
  function t(r, a) {
    var i;
    i = e.call(this, r, a) || this;
    var s = a, c = s && !s.isMounting ? r.enter : r.appear, u;
    return i.appearStatus = null, r.in ? c ? (u = Or, i.appearStatus = xr) : u = Fr : r.unmountOnExit || r.mountOnEnter ? u = $a : u = Or, i.state = {
      status: u
    }, i.nextCallback = null, i;
  }
  t.getDerivedStateFromProps = function(a, i) {
    var s = a.in;
    return s && i.status === $a ? {
      status: Or
    } : null;
  };
  var n = t.prototype;
  return n.componentDidMount = function() {
    this.updateStatus(!0, this.appearStatus);
  }, n.componentDidUpdate = function(a) {
    var i = null;
    if (a !== this.props) {
      var s = this.state.status;
      this.props.in ? s !== xr && s !== Fr && (i = xr) : (s === xr || s === Fr) && (i = sl);
    }
    this.updateStatus(!1, i);
  }, n.componentWillUnmount = function() {
    this.cancelNextCallback();
  }, n.getTimeouts = function() {
    var a = this.props.timeout, i, s, c;
    return i = s = c = a, a != null && typeof a != "number" && (i = a.exit, s = a.enter, c = a.appear !== void 0 ? a.appear : s), {
      exit: i,
      enter: s,
      appear: c
    };
  }, n.updateStatus = function(a, i) {
    if (a === void 0 && (a = !1), i !== null)
      if (this.cancelNextCallback(), i === xr) {
        if (this.props.unmountOnExit || this.props.mountOnEnter) {
          var s = this.props.nodeRef ? this.props.nodeRef.current : di.findDOMNode(this);
          s && wC(s);
        }
        this.performEnter(a);
      } else
        this.performExit();
    else this.props.unmountOnExit && this.state.status === Or && this.setState({
      status: $a
    });
  }, n.performEnter = function(a) {
    var i = this, s = this.props.enter, c = this.context ? this.context.isMounting : a, u = this.props.nodeRef ? [c] : [di.findDOMNode(this), c], p = u[0], g = u[1], v = this.getTimeouts(), y = c ? v.appear : v.enter;
    if (!a && !s || Vu.disabled) {
      this.safeSetState({
        status: Fr
      }, function() {
        i.props.onEntered(p);
      });
      return;
    }
    this.props.onEnter(p, g), this.safeSetState({
      status: xr
    }, function() {
      i.props.onEntering(p, g), i.onTransitionEnd(y, function() {
        i.safeSetState({
          status: Fr
        }, function() {
          i.props.onEntered(p, g);
        });
      });
    });
  }, n.performExit = function() {
    var a = this, i = this.props.exit, s = this.getTimeouts(), c = this.props.nodeRef ? void 0 : di.findDOMNode(this);
    if (!i || Vu.disabled) {
      this.safeSetState({
        status: Or
      }, function() {
        a.props.onExited(c);
      });
      return;
    }
    this.props.onExit(c), this.safeSetState({
      status: sl
    }, function() {
      a.props.onExiting(c), a.onTransitionEnd(s.exit, function() {
        a.safeSetState({
          status: Or
        }, function() {
          a.props.onExited(c);
        });
      });
    });
  }, n.cancelNextCallback = function() {
    this.nextCallback !== null && (this.nextCallback.cancel(), this.nextCallback = null);
  }, n.safeSetState = function(a, i) {
    i = this.setNextCallback(i), this.setState(a, i);
  }, n.setNextCallback = function(a) {
    var i = this, s = !0;
    return this.nextCallback = function(c) {
      s && (s = !1, i.nextCallback = null, a(c));
    }, this.nextCallback.cancel = function() {
      s = !1;
    }, this.nextCallback;
  }, n.onTransitionEnd = function(a, i) {
    this.setNextCallback(i);
    var s = this.props.nodeRef ? this.props.nodeRef.current : di.findDOMNode(this), c = a == null && !this.props.addEndListener;
    if (!s || c) {
      setTimeout(this.nextCallback, 0);
      return;
    }
    if (this.props.addEndListener) {
      var u = this.props.nodeRef ? [this.nextCallback] : [s, this.nextCallback], p = u[0], g = u[1];
      this.props.addEndListener(p, g);
    }
    a != null && setTimeout(this.nextCallback, a);
  }, n.render = function() {
    var a = this.state.status;
    if (a === $a)
      return null;
    var i = this.props, s = i.children;
    i.in, i.mountOnEnter, i.unmountOnExit, i.appear, i.enter, i.exit, i.timeout, i.addEndListener, i.onEnter, i.onEntering, i.onEntered, i.onExit, i.onExiting, i.onExited, i.nodeRef;
    var c = vn(i, ["children", "in", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);
    return (
      // allows for nested Transitions
      /* @__PURE__ */ l.createElement(pp.Provider, {
        value: null
      }, typeof s == "function" ? s(a, c) : l.cloneElement(l.Children.only(s), c))
    );
  }, t;
}(l.Component);
nr.contextType = pp;
nr.propTypes = {};
function na() {
}
nr.defaultProps = {
  in: !1,
  mountOnEnter: !1,
  unmountOnExit: !1,
  appear: !1,
  enter: !0,
  exit: !0,
  onEnter: na,
  onEntering: na,
  onEntered: na,
  onExit: na,
  onExiting: na,
  onExited: na
};
nr.UNMOUNTED = $a;
nr.EXITED = Or;
nr.ENTERING = xr;
nr.ENTERED = Fr;
nr.EXITING = sl;
function mp() {
  var e = Lo() || fp;
  return e;
}
var xC = function(t) {
  return t.scrollTop;
};
function Uu(e, t) {
  var n = e.timeout, r = e.style, a = r === void 0 ? {} : r;
  return {
    duration: a.transitionDuration || typeof n == "number" ? n : n[t.mode] || 0,
    delay: a.transitionDelay
  };
}
function ca(e, t) {
  typeof e == "function" ? e(t) : e && (e.current = t);
}
function Lr(e, t) {
  return le.useMemo(function() {
    return e == null && t == null ? null : function(n) {
      ca(e, n), ca(t, n);
    };
  }, [e, t]);
}
function ll(e) {
  return "scale(".concat(e, ", ").concat(Math.pow(e, 2), ")");
}
var EC = {
  entering: {
    opacity: 1,
    transform: ll(1)
  },
  entered: {
    opacity: 1,
    transform: "none"
  }
}, gp = /* @__PURE__ */ le.forwardRef(function(t, n) {
  var r = t.children, a = t.disableStrictModeCompat, i = a === void 0 ? !1 : a, s = t.in, c = t.onEnter, u = t.onEntered, p = t.onEntering, g = t.onExit, v = t.onExited, y = t.onExiting, E = t.style, L = t.timeout, x = L === void 0 ? "auto" : L, C = t.TransitionComponent, T = C === void 0 ? nr : C, D = Jt(t, ["children", "disableStrictModeCompat", "in", "onEnter", "onEntered", "onEntering", "onExit", "onExited", "onExiting", "style", "timeout", "TransitionComponent"]), k = le.useRef(), N = le.useRef(), R = mp(), A = R.unstable_strictMode && !i, f = le.useRef(null), _ = Lr(r.ref, n), O = Lr(A ? f : void 0, _), J = function(Te) {
    return function(We, Oe) {
      if (Te) {
        var Ne = A ? [f.current, We] : [We, Oe], Me = Vn(Ne, 2), Ze = Me[0], at = Me[1];
        at === void 0 ? Te(Ze) : Te(Ze, at);
      }
    };
  }, ee = J(p), ge = J(function(xe, Te) {
    xC(xe);
    var We = Uu({
      style: E,
      timeout: x
    }, {
      mode: "enter"
    }), Oe = We.duration, Ne = We.delay, Me;
    x === "auto" ? (Me = R.transitions.getAutoHeightDuration(xe.clientHeight), N.current = Me) : Me = Oe, xe.style.transition = [R.transitions.create("opacity", {
      duration: Me,
      delay: Ne
    }), R.transitions.create("transform", {
      duration: Me * 0.666,
      delay: Ne
    })].join(","), c && c(xe, Te);
  }), ie = J(u), fe = J(y), be = J(function(xe) {
    var Te = Uu({
      style: E,
      timeout: x
    }, {
      mode: "exit"
    }), We = Te.duration, Oe = Te.delay, Ne;
    x === "auto" ? (Ne = R.transitions.getAutoHeightDuration(xe.clientHeight), N.current = Ne) : Ne = We, xe.style.transition = [R.transitions.create("opacity", {
      duration: Ne,
      delay: Oe
    }), R.transitions.create("transform", {
      duration: Ne * 0.666,
      delay: Oe || Ne * 0.333
    })].join(","), xe.style.opacity = "0", xe.style.transform = ll(0.75), g && g(xe);
  }), $e = J(v), Se = function(Te, We) {
    var Oe = A ? Te : We;
    x === "auto" && (k.current = setTimeout(Oe, N.current || 0));
  };
  return le.useEffect(function() {
    return function() {
      clearTimeout(k.current);
    };
  }, []), /* @__PURE__ */ le.createElement(T, Z({
    appear: !0,
    in: s,
    nodeRef: A ? f : void 0,
    onEnter: ge,
    onEntered: ie,
    onEntering: ee,
    onExit: be,
    onExited: $e,
    onExiting: fe,
    addEndListener: Se,
    timeout: x === "auto" ? null : x
  }, D), function(xe, Te) {
    return /* @__PURE__ */ le.cloneElement(r, Z({
      style: Z({
        opacity: 0,
        transform: ll(0.75),
        visibility: xe === "exited" && !s ? "hidden" : void 0
      }, EC[xe], E, r.props.style),
      ref: O
    }, Te));
  });
});
gp.muiSupportAuto = !0;
/**!
 * @fileOverview Kickass library to create and place poppers near their reference elements.
 * @version 1.16.1-lts
 * @license
 * Copyright (c) 2016 Federico Zivolo and contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var Ga = typeof window < "u" && typeof document < "u" && typeof navigator < "u", LC = function() {
  for (var e = ["Edge", "Trident", "Firefox"], t = 0; t < e.length; t += 1)
    if (Ga && navigator.userAgent.indexOf(e[t]) >= 0)
      return 1;
  return 0;
}();
function CC(e) {
  var t = !1;
  return function() {
    t || (t = !0, window.Promise.resolve().then(function() {
      t = !1, e();
    }));
  };
}
function SC(e) {
  var t = !1;
  return function() {
    t || (t = !0, setTimeout(function() {
      t = !1, e();
    }, LC));
  };
}
var TC = Ga && window.Promise, DC = TC ? CC : SC;
function hp(e) {
  var t = {};
  return e && t.toString.call(e) === "[object Function]";
}
function zr(e, t) {
  if (e.nodeType !== 1)
    return [];
  var n = e.ownerDocument.defaultView, r = n.getComputedStyle(e, null);
  return t ? r[t] : r;
}
function Jl(e) {
  return e.nodeName === "HTML" ? e : e.parentNode || e.host;
}
function Ka(e) {
  if (!e)
    return document.body;
  switch (e.nodeName) {
    case "HTML":
    case "BODY":
      return e.ownerDocument.body;
    case "#document":
      return e.body;
  }
  var t = zr(e), n = t.overflow, r = t.overflowX, a = t.overflowY;
  return /(auto|scroll|overlay)/.test(n + a + r) ? e : Ka(Jl(e));
}
function vp(e) {
  return e && e.referenceNode ? e.referenceNode : e;
}
var Bu = Ga && !!(window.MSInputMethodContext && document.documentMode), Hu = Ga && /MSIE 10/.test(navigator.userAgent);
function ha(e) {
  return e === 11 ? Bu : e === 10 ? Hu : Bu || Hu;
}
function ua(e) {
  if (!e)
    return document.documentElement;
  for (var t = ha(10) ? document.body : null, n = e.offsetParent || null; n === t && e.nextElementSibling; )
    n = (e = e.nextElementSibling).offsetParent;
  var r = n && n.nodeName;
  return !r || r === "BODY" || r === "HTML" ? e ? e.ownerDocument.documentElement : document.documentElement : ["TH", "TD", "TABLE"].indexOf(n.nodeName) !== -1 && zr(n, "position") === "static" ? ua(n) : n;
}
function kC(e) {
  var t = e.nodeName;
  return t === "BODY" ? !1 : t === "HTML" || ua(e.firstElementChild) === e;
}
function cl(e) {
  return e.parentNode !== null ? cl(e.parentNode) : e;
}
function Gi(e, t) {
  if (!e || !e.nodeType || !t || !t.nodeType)
    return document.documentElement;
  var n = e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING, r = n ? e : t, a = n ? t : e, i = document.createRange();
  i.setStart(r, 0), i.setEnd(a, 0);
  var s = i.commonAncestorContainer;
  if (e !== s && t !== s || r.contains(a))
    return kC(s) ? s : ua(s);
  var c = cl(e);
  return c.host ? Gi(c.host, t) : Gi(e, cl(t).host);
}
function da(e) {
  var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "top", n = t === "top" ? "scrollTop" : "scrollLeft", r = e.nodeName;
  if (r === "BODY" || r === "HTML") {
    var a = e.ownerDocument.documentElement, i = e.ownerDocument.scrollingElement || a;
    return i[n];
  }
  return e[n];
}
function PC(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !1, r = da(t, "top"), a = da(t, "left"), i = n ? -1 : 1;
  return e.top += r * i, e.bottom += r * i, e.left += a * i, e.right += a * i, e;
}
function zu(e, t) {
  var n = t === "x" ? "Left" : "Top", r = n === "Left" ? "Right" : "Bottom";
  return parseFloat(e["border" + n + "Width"]) + parseFloat(e["border" + r + "Width"]);
}
function qu(e, t, n, r) {
  return Math.max(t["offset" + e], t["scroll" + e], n["client" + e], n["offset" + e], n["scroll" + e], ha(10) ? parseInt(n["offset" + e]) + parseInt(r["margin" + (e === "Height" ? "Top" : "Left")]) + parseInt(r["margin" + (e === "Height" ? "Bottom" : "Right")]) : 0);
}
function yp(e) {
  var t = e.body, n = e.documentElement, r = ha(10) && getComputedStyle(n);
  return {
    height: qu("Height", t, n, r),
    width: qu("Width", t, n, r)
  };
}
var NC = function(e, t) {
  if (!(e instanceof t))
    throw new TypeError("Cannot call a class as a function");
}, RC = /* @__PURE__ */ function() {
  function e(t, n) {
    for (var r = 0; r < n.length; r++) {
      var a = n[r];
      a.enumerable = a.enumerable || !1, a.configurable = !0, "value" in a && (a.writable = !0), Object.defineProperty(t, a.key, a);
    }
  }
  return function(t, n, r) {
    return n && e(t.prototype, n), r && e(t, r), t;
  };
}(), fa = function(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}, $n = Object.assign || function(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t];
    for (var r in n)
      Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
  }
  return e;
};
function Dr(e) {
  return $n({}, e, {
    right: e.left + e.width,
    bottom: e.top + e.height
  });
}
function ul(e) {
  var t = {};
  try {
    if (ha(10)) {
      t = e.getBoundingClientRect();
      var n = da(e, "top"), r = da(e, "left");
      t.top += n, t.left += r, t.bottom += n, t.right += r;
    } else
      t = e.getBoundingClientRect();
  } catch {
  }
  var a = {
    left: t.left,
    top: t.top,
    width: t.right - t.left,
    height: t.bottom - t.top
  }, i = e.nodeName === "HTML" ? yp(e.ownerDocument) : {}, s = i.width || e.clientWidth || a.width, c = i.height || e.clientHeight || a.height, u = e.offsetWidth - s, p = e.offsetHeight - c;
  if (u || p) {
    var g = zr(e);
    u -= zu(g, "x"), p -= zu(g, "y"), a.width -= u, a.height -= p;
  }
  return Dr(a);
}
function Ql(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : !1, r = ha(10), a = t.nodeName === "HTML", i = ul(e), s = ul(t), c = Ka(e), u = zr(t), p = parseFloat(u.borderTopWidth), g = parseFloat(u.borderLeftWidth);
  n && a && (s.top = Math.max(s.top, 0), s.left = Math.max(s.left, 0));
  var v = Dr({
    top: i.top - s.top - p,
    left: i.left - s.left - g,
    width: i.width,
    height: i.height
  });
  if (v.marginTop = 0, v.marginLeft = 0, !r && a) {
    var y = parseFloat(u.marginTop), E = parseFloat(u.marginLeft);
    v.top -= p - y, v.bottom -= p - y, v.left -= g - E, v.right -= g - E, v.marginTop = y, v.marginLeft = E;
  }
  return (r && !n ? t.contains(c) : t === c && c.nodeName !== "BODY") && (v = PC(v, t)), v;
}
function IC(e) {
  var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1, n = e.ownerDocument.documentElement, r = Ql(e, n), a = Math.max(n.clientWidth, window.innerWidth || 0), i = Math.max(n.clientHeight, window.innerHeight || 0), s = t ? 0 : da(n), c = t ? 0 : da(n, "left"), u = {
    top: s - r.top + r.marginTop,
    left: c - r.left + r.marginLeft,
    width: a,
    height: i
  };
  return Dr(u);
}
function bp(e) {
  var t = e.nodeName;
  if (t === "BODY" || t === "HTML")
    return !1;
  if (zr(e, "position") === "fixed")
    return !0;
  var n = Jl(e);
  return n ? bp(n) : !1;
}
function wp(e) {
  if (!e || !e.parentElement || ha())
    return document.documentElement;
  for (var t = e.parentElement; t && zr(t, "transform") === "none"; )
    t = t.parentElement;
  return t || document.documentElement;
}
function Xl(e, t, n, r) {
  var a = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !1, i = { top: 0, left: 0 }, s = a ? wp(e) : Gi(e, vp(t));
  if (r === "viewport")
    i = IC(s, a);
  else {
    var c = void 0;
    r === "scrollParent" ? (c = Ka(Jl(t)), c.nodeName === "BODY" && (c = e.ownerDocument.documentElement)) : r === "window" ? c = e.ownerDocument.documentElement : c = r;
    var u = Ql(c, s, a);
    if (c.nodeName === "HTML" && !bp(s)) {
      var p = yp(e.ownerDocument), g = p.height, v = p.width;
      i.top += u.top - u.marginTop, i.bottom = g + u.top, i.left += u.left - u.marginLeft, i.right = v + u.left;
    } else
      i = u;
  }
  n = n || 0;
  var y = typeof n == "number";
  return i.left += y ? n : n.left || 0, i.top += y ? n : n.top || 0, i.right -= y ? n : n.right || 0, i.bottom -= y ? n : n.bottom || 0, i;
}
function AC(e) {
  var t = e.width, n = e.height;
  return t * n;
}
function xp(e, t, n, r, a) {
  var i = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : 0;
  if (e.indexOf("auto") === -1)
    return e;
  var s = Xl(n, r, i, a), c = {
    top: {
      width: s.width,
      height: t.top - s.top
    },
    right: {
      width: s.right - t.right,
      height: s.height
    },
    bottom: {
      width: s.width,
      height: s.bottom - t.bottom
    },
    left: {
      width: t.left - s.left,
      height: s.height
    }
  }, u = Object.keys(c).map(function(y) {
    return $n({
      key: y
    }, c[y], {
      area: AC(c[y])
    });
  }).sort(function(y, E) {
    return E.area - y.area;
  }), p = u.filter(function(y) {
    var E = y.width, L = y.height;
    return E >= n.clientWidth && L >= n.clientHeight;
  }), g = p.length > 0 ? p[0].key : u[0].key, v = e.split("-")[1];
  return g + (v ? "-" + v : "");
}
function Ep(e, t, n) {
  var r = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null, a = r ? wp(t) : Gi(t, vp(n));
  return Ql(n, a, r);
}
function Lp(e) {
  var t = e.ownerDocument.defaultView, n = t.getComputedStyle(e), r = parseFloat(n.marginTop || 0) + parseFloat(n.marginBottom || 0), a = parseFloat(n.marginLeft || 0) + parseFloat(n.marginRight || 0), i = {
    width: e.offsetWidth + a,
    height: e.offsetHeight + r
  };
  return i;
}
function Ki(e) {
  var t = { left: "right", right: "left", bottom: "top", top: "bottom" };
  return e.replace(/left|right|bottom|top/g, function(n) {
    return t[n];
  });
}
function Cp(e, t, n) {
  n = n.split("-")[0];
  var r = Lp(e), a = {
    width: r.width,
    height: r.height
  }, i = ["right", "left"].indexOf(n) !== -1, s = i ? "top" : "left", c = i ? "left" : "top", u = i ? "height" : "width", p = i ? "width" : "height";
  return a[s] = t[s] + t[u] / 2 - r[u] / 2, n === c ? a[c] = t[c] - r[p] : a[c] = t[Ki(c)], a;
}
function Ja(e, t) {
  return Array.prototype.find ? e.find(t) : e.filter(t)[0];
}
function OC(e, t, n) {
  if (Array.prototype.findIndex)
    return e.findIndex(function(a) {
      return a[t] === n;
    });
  var r = Ja(e, function(a) {
    return a[t] === n;
  });
  return e.indexOf(r);
}
function Sp(e, t, n) {
  var r = n === void 0 ? e : e.slice(0, OC(e, "name", n));
  return r.forEach(function(a) {
    a.function && console.warn("`modifier.function` is deprecated, use `modifier.fn`!");
    var i = a.function || a.fn;
    a.enabled && hp(i) && (t.offsets.popper = Dr(t.offsets.popper), t.offsets.reference = Dr(t.offsets.reference), t = i(t, a));
  }), t;
}
function MC() {
  if (!this.state.isDestroyed) {
    var e = {
      instance: this,
      styles: {},
      arrowStyles: {},
      attributes: {},
      flipped: !1,
      offsets: {}
    };
    e.offsets.reference = Ep(this.state, this.popper, this.reference, this.options.positionFixed), e.placement = xp(this.options.placement, e.offsets.reference, this.popper, this.reference, this.options.modifiers.flip.boundariesElement, this.options.modifiers.flip.padding), e.originalPlacement = e.placement, e.positionFixed = this.options.positionFixed, e.offsets.popper = Cp(this.popper, e.offsets.reference, e.placement), e.offsets.popper.position = this.options.positionFixed ? "fixed" : "absolute", e = Sp(this.modifiers, e), this.state.isCreated ? this.options.onUpdate(e) : (this.state.isCreated = !0, this.options.onCreate(e));
  }
}
function Tp(e, t) {
  return e.some(function(n) {
    var r = n.name, a = n.enabled;
    return a && r === t;
  });
}
function Zl(e) {
  for (var t = [!1, "ms", "Webkit", "Moz", "O"], n = e.charAt(0).toUpperCase() + e.slice(1), r = 0; r < t.length; r++) {
    var a = t[r], i = a ? "" + a + n : e;
    if (typeof document.body.style[i] < "u")
      return i;
  }
  return null;
}
function $C() {
  return this.state.isDestroyed = !0, Tp(this.modifiers, "applyStyle") && (this.popper.removeAttribute("x-placement"), this.popper.style.position = "", this.popper.style.top = "", this.popper.style.left = "", this.popper.style.right = "", this.popper.style.bottom = "", this.popper.style.willChange = "", this.popper.style[Zl("transform")] = ""), this.disableEventListeners(), this.options.removeOnDestroy && this.popper.parentNode.removeChild(this.popper), this;
}
function Dp(e) {
  var t = e.ownerDocument;
  return t ? t.defaultView : window;
}
function kp(e, t, n, r) {
  var a = e.nodeName === "BODY", i = a ? e.ownerDocument.defaultView : e;
  i.addEventListener(t, n, { passive: !0 }), a || kp(Ka(i.parentNode), t, n, r), r.push(i);
}
function FC(e, t, n, r) {
  n.updateBound = r, Dp(e).addEventListener("resize", n.updateBound, { passive: !0 });
  var a = Ka(e);
  return kp(a, "scroll", n.updateBound, n.scrollParents), n.scrollElement = a, n.eventsEnabled = !0, n;
}
function _C() {
  this.state.eventsEnabled || (this.state = FC(this.reference, this.options, this.state, this.scheduleUpdate));
}
function jC(e, t) {
  return Dp(e).removeEventListener("resize", t.updateBound), t.scrollParents.forEach(function(n) {
    n.removeEventListener("scroll", t.updateBound);
  }), t.updateBound = null, t.scrollParents = [], t.scrollElement = null, t.eventsEnabled = !1, t;
}
function VC() {
  this.state.eventsEnabled && (cancelAnimationFrame(this.scheduleUpdate), this.state = jC(this.reference, this.state));
}
function ec(e) {
  return e !== "" && !isNaN(parseFloat(e)) && isFinite(e);
}
function dl(e, t) {
  Object.keys(t).forEach(function(n) {
    var r = "";
    ["width", "height", "top", "right", "bottom", "left"].indexOf(n) !== -1 && ec(t[n]) && (r = "px"), e.style[n] = t[n] + r;
  });
}
function UC(e, t) {
  Object.keys(t).forEach(function(n) {
    var r = t[n];
    r !== !1 ? e.setAttribute(n, t[n]) : e.removeAttribute(n);
  });
}
function BC(e) {
  return dl(e.instance.popper, e.styles), UC(e.instance.popper, e.attributes), e.arrowElement && Object.keys(e.arrowStyles).length && dl(e.arrowElement, e.arrowStyles), e;
}
function HC(e, t, n, r, a) {
  var i = Ep(a, t, e, n.positionFixed), s = xp(n.placement, i, t, e, n.modifiers.flip.boundariesElement, n.modifiers.flip.padding);
  return t.setAttribute("x-placement", s), dl(t, { position: n.positionFixed ? "fixed" : "absolute" }), n;
}
function zC(e, t) {
  var n = e.offsets, r = n.popper, a = n.reference, i = Math.round, s = Math.floor, c = function(T) {
    return T;
  }, u = i(a.width), p = i(r.width), g = ["left", "right"].indexOf(e.placement) !== -1, v = e.placement.indexOf("-") !== -1, y = u % 2 === p % 2, E = u % 2 === 1 && p % 2 === 1, L = t ? g || v || y ? i : s : c, x = t ? i : c;
  return {
    left: L(E && !v && t ? r.left - 1 : r.left),
    top: x(r.top),
    bottom: x(r.bottom),
    right: L(r.right)
  };
}
var qC = Ga && /Firefox/i.test(navigator.userAgent);
function WC(e, t) {
  var n = t.x, r = t.y, a = e.offsets.popper, i = Ja(e.instance.modifiers, function(k) {
    return k.name === "applyStyle";
  }).gpuAcceleration;
  i !== void 0 && console.warn("WARNING: `gpuAcceleration` option moved to `computeStyle` modifier and will not be supported in future versions of Popper.js!");
  var s = i !== void 0 ? i : t.gpuAcceleration, c = ua(e.instance.popper), u = ul(c), p = {
    position: a.position
  }, g = zC(e, window.devicePixelRatio < 2 || !qC), v = n === "bottom" ? "top" : "bottom", y = r === "right" ? "left" : "right", E = Zl("transform"), L = void 0, x = void 0;
  if (v === "bottom" ? c.nodeName === "HTML" ? x = -c.clientHeight + g.bottom : x = -u.height + g.bottom : x = g.top, y === "right" ? c.nodeName === "HTML" ? L = -c.clientWidth + g.right : L = -u.width + g.right : L = g.left, s && E)
    p[E] = "translate3d(" + L + "px, " + x + "px, 0)", p[v] = 0, p[y] = 0, p.willChange = "transform";
  else {
    var C = v === "bottom" ? -1 : 1, T = y === "right" ? -1 : 1;
    p[v] = x * C, p[y] = L * T, p.willChange = v + ", " + y;
  }
  var D = {
    "x-placement": e.placement
  };
  return e.attributes = $n({}, D, e.attributes), e.styles = $n({}, p, e.styles), e.arrowStyles = $n({}, e.offsets.arrow, e.arrowStyles), e;
}
function Pp(e, t, n) {
  var r = Ja(e, function(c) {
    var u = c.name;
    return u === t;
  }), a = !!r && e.some(function(c) {
    return c.name === n && c.enabled && c.order < r.order;
  });
  if (!a) {
    var i = "`" + t + "`", s = "`" + n + "`";
    console.warn(s + " modifier is required by " + i + " modifier in order to work, be sure to include it before " + i + "!");
  }
  return a;
}
function YC(e, t) {
  var n;
  if (!Pp(e.instance.modifiers, "arrow", "keepTogether"))
    return e;
  var r = t.element;
  if (typeof r == "string") {
    if (r = e.instance.popper.querySelector(r), !r)
      return e;
  } else if (!e.instance.popper.contains(r))
    return console.warn("WARNING: `arrow.element` must be child of its popper element!"), e;
  var a = e.placement.split("-")[0], i = e.offsets, s = i.popper, c = i.reference, u = ["left", "right"].indexOf(a) !== -1, p = u ? "height" : "width", g = u ? "Top" : "Left", v = g.toLowerCase(), y = u ? "left" : "top", E = u ? "bottom" : "right", L = Lp(r)[p];
  c[E] - L < s[v] && (e.offsets.popper[v] -= s[v] - (c[E] - L)), c[v] + L > s[E] && (e.offsets.popper[v] += c[v] + L - s[E]), e.offsets.popper = Dr(e.offsets.popper);
  var x = c[v] + c[p] / 2 - L / 2, C = zr(e.instance.popper), T = parseFloat(C["margin" + g]), D = parseFloat(C["border" + g + "Width"]), k = x - e.offsets.popper[v] - T - D;
  return k = Math.max(Math.min(s[p] - L, k), 0), e.arrowElement = r, e.offsets.arrow = (n = {}, fa(n, v, Math.round(k)), fa(n, y, ""), n), e;
}
function GC(e) {
  return e === "end" ? "start" : e === "start" ? "end" : e;
}
var Np = ["auto-start", "auto", "auto-end", "top-start", "top", "top-end", "right-start", "right", "right-end", "bottom-end", "bottom", "bottom-start", "left-end", "left", "left-start"], Ds = Np.slice(3);
function Wu(e) {
  var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !1, n = Ds.indexOf(e), r = Ds.slice(n + 1).concat(Ds.slice(0, n));
  return t ? r.reverse() : r;
}
var ks = {
  FLIP: "flip",
  CLOCKWISE: "clockwise",
  COUNTERCLOCKWISE: "counterclockwise"
};
function KC(e, t) {
  if (Tp(e.instance.modifiers, "inner") || e.flipped && e.placement === e.originalPlacement)
    return e;
  var n = Xl(e.instance.popper, e.instance.reference, t.padding, t.boundariesElement, e.positionFixed), r = e.placement.split("-")[0], a = Ki(r), i = e.placement.split("-")[1] || "", s = [];
  switch (t.behavior) {
    case ks.FLIP:
      s = [r, a];
      break;
    case ks.CLOCKWISE:
      s = Wu(r);
      break;
    case ks.COUNTERCLOCKWISE:
      s = Wu(r, !0);
      break;
    default:
      s = t.behavior;
  }
  return s.forEach(function(c, u) {
    if (r !== c || s.length === u + 1)
      return e;
    r = e.placement.split("-")[0], a = Ki(r);
    var p = e.offsets.popper, g = e.offsets.reference, v = Math.floor, y = r === "left" && v(p.right) > v(g.left) || r === "right" && v(p.left) < v(g.right) || r === "top" && v(p.bottom) > v(g.top) || r === "bottom" && v(p.top) < v(g.bottom), E = v(p.left) < v(n.left), L = v(p.right) > v(n.right), x = v(p.top) < v(n.top), C = v(p.bottom) > v(n.bottom), T = r === "left" && E || r === "right" && L || r === "top" && x || r === "bottom" && C, D = ["top", "bottom"].indexOf(r) !== -1, k = !!t.flipVariations && (D && i === "start" && E || D && i === "end" && L || !D && i === "start" && x || !D && i === "end" && C), N = !!t.flipVariationsByContent && (D && i === "start" && L || D && i === "end" && E || !D && i === "start" && C || !D && i === "end" && x), R = k || N;
    (y || T || R) && (e.flipped = !0, (y || T) && (r = s[u + 1]), R && (i = GC(i)), e.placement = r + (i ? "-" + i : ""), e.offsets.popper = $n({}, e.offsets.popper, Cp(e.instance.popper, e.offsets.reference, e.placement)), e = Sp(e.instance.modifiers, e, "flip"));
  }), e;
}
function JC(e) {
  var t = e.offsets, n = t.popper, r = t.reference, a = e.placement.split("-")[0], i = Math.floor, s = ["top", "bottom"].indexOf(a) !== -1, c = s ? "right" : "bottom", u = s ? "left" : "top", p = s ? "width" : "height";
  return n[c] < i(r[u]) && (e.offsets.popper[u] = i(r[u]) - n[p]), n[u] > i(r[c]) && (e.offsets.popper[u] = i(r[c])), e;
}
function QC(e, t, n, r) {
  var a = e.match(/((?:\-|\+)?\d*\.?\d*)(.*)/), i = +a[1], s = a[2];
  if (!i)
    return e;
  if (s.indexOf("%") === 0) {
    var c = void 0;
    switch (s) {
      case "%p":
        c = n;
        break;
      case "%":
      case "%r":
      default:
        c = r;
    }
    var u = Dr(c);
    return u[t] / 100 * i;
  } else if (s === "vh" || s === "vw") {
    var p = void 0;
    return s === "vh" ? p = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) : p = Math.max(document.documentElement.clientWidth, window.innerWidth || 0), p / 100 * i;
  } else
    return i;
}
function XC(e, t, n, r) {
  var a = [0, 0], i = ["right", "left"].indexOf(r) !== -1, s = e.split(/(\+|\-)/).map(function(g) {
    return g.trim();
  }), c = s.indexOf(Ja(s, function(g) {
    return g.search(/,|\s/) !== -1;
  }));
  s[c] && s[c].indexOf(",") === -1 && console.warn("Offsets separated by white space(s) are deprecated, use a comma (,) instead.");
  var u = /\s*,\s*|\s+/, p = c !== -1 ? [s.slice(0, c).concat([s[c].split(u)[0]]), [s[c].split(u)[1]].concat(s.slice(c + 1))] : [s];
  return p = p.map(function(g, v) {
    var y = (v === 1 ? !i : i) ? "height" : "width", E = !1;
    return g.reduce(function(L, x) {
      return L[L.length - 1] === "" && ["+", "-"].indexOf(x) !== -1 ? (L[L.length - 1] = x, E = !0, L) : E ? (L[L.length - 1] += x, E = !1, L) : L.concat(x);
    }, []).map(function(L) {
      return QC(L, y, t, n);
    });
  }), p.forEach(function(g, v) {
    g.forEach(function(y, E) {
      ec(y) && (a[v] += y * (g[E - 1] === "-" ? -1 : 1));
    });
  }), a;
}
function ZC(e, t) {
  var n = t.offset, r = e.placement, a = e.offsets, i = a.popper, s = a.reference, c = r.split("-")[0], u = void 0;
  return ec(+n) ? u = [+n, 0] : u = XC(n, i, s, c), c === "left" ? (i.top += u[0], i.left -= u[1]) : c === "right" ? (i.top += u[0], i.left += u[1]) : c === "top" ? (i.left += u[0], i.top -= u[1]) : c === "bottom" && (i.left += u[0], i.top += u[1]), e.popper = i, e;
}
function eS(e, t) {
  var n = t.boundariesElement || ua(e.instance.popper);
  e.instance.reference === n && (n = ua(n));
  var r = Zl("transform"), a = e.instance.popper.style, i = a.top, s = a.left, c = a[r];
  a.top = "", a.left = "", a[r] = "";
  var u = Xl(e.instance.popper, e.instance.reference, t.padding, n, e.positionFixed);
  a.top = i, a.left = s, a[r] = c, t.boundaries = u;
  var p = t.priority, g = e.offsets.popper, v = {
    primary: function(E) {
      var L = g[E];
      return g[E] < u[E] && !t.escapeWithReference && (L = Math.max(g[E], u[E])), fa({}, E, L);
    },
    secondary: function(E) {
      var L = E === "right" ? "left" : "top", x = g[L];
      return g[E] > u[E] && !t.escapeWithReference && (x = Math.min(g[L], u[E] - (E === "right" ? g.width : g.height))), fa({}, L, x);
    }
  };
  return p.forEach(function(y) {
    var E = ["left", "top"].indexOf(y) !== -1 ? "primary" : "secondary";
    g = $n({}, g, v[E](y));
  }), e.offsets.popper = g, e;
}
function tS(e) {
  var t = e.placement, n = t.split("-")[0], r = t.split("-")[1];
  if (r) {
    var a = e.offsets, i = a.reference, s = a.popper, c = ["bottom", "top"].indexOf(n) !== -1, u = c ? "left" : "top", p = c ? "width" : "height", g = {
      start: fa({}, u, i[u]),
      end: fa({}, u, i[u] + i[p] - s[p])
    };
    e.offsets.popper = $n({}, s, g[r]);
  }
  return e;
}
function nS(e) {
  if (!Pp(e.instance.modifiers, "hide", "preventOverflow"))
    return e;
  var t = e.offsets.reference, n = Ja(e.instance.modifiers, function(r) {
    return r.name === "preventOverflow";
  }).boundaries;
  if (t.bottom < n.top || t.left > n.right || t.top > n.bottom || t.right < n.left) {
    if (e.hide === !0)
      return e;
    e.hide = !0, e.attributes["x-out-of-boundaries"] = "";
  } else {
    if (e.hide === !1)
      return e;
    e.hide = !1, e.attributes["x-out-of-boundaries"] = !1;
  }
  return e;
}
function rS(e) {
  var t = e.placement, n = t.split("-")[0], r = e.offsets, a = r.popper, i = r.reference, s = ["left", "right"].indexOf(n) !== -1, c = ["top", "left"].indexOf(n) === -1;
  return a[s ? "left" : "top"] = i[n] - (c ? a[s ? "width" : "height"] : 0), e.placement = Ki(t), e.offsets.popper = Dr(a), e;
}
var aS = {
  /**
   * Modifier used to shift the popper on the start or end of its reference
   * element.<br />
   * It will read the variation of the `placement` property.<br />
   * It can be one either `-end` or `-start`.
   * @memberof modifiers
   * @inner
   */
  shift: {
    /** @prop {number} order=100 - Index used to define the order of execution */
    order: 100,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: tS
  },
  /**
   * The `offset` modifier can shift your popper on both its axis.
   *
   * It accepts the following units:
   * - `px` or unit-less, interpreted as pixels
   * - `%` or `%r`, percentage relative to the length of the reference element
   * - `%p`, percentage relative to the length of the popper element
   * - `vw`, CSS viewport width unit
   * - `vh`, CSS viewport height unit
   *
   * For length is intended the main axis relative to the placement of the popper.<br />
   * This means that if the placement is `top` or `bottom`, the length will be the
   * `width`. In case of `left` or `right`, it will be the `height`.
   *
   * You can provide a single value (as `Number` or `String`), or a pair of values
   * as `String` divided by a comma or one (or more) white spaces.<br />
   * The latter is a deprecated method because it leads to confusion and will be
   * removed in v2.<br />
   * Additionally, it accepts additions and subtractions between different units.
   * Note that multiplications and divisions aren't supported.
   *
   * Valid examples are:
   * ```
   * 10
   * '10%'
   * '10, 10'
   * '10%, 10'
   * '10 + 10%'
   * '10 - 5vh + 3%'
   * '-10px + 5vh, 5px - 6%'
   * ```
   * > **NB**: If you desire to apply offsets to your poppers in a way that may make them overlap
   * > with their reference element, unfortunately, you will have to disable the `flip` modifier.
   * > You can read more on this at this [issue](https://github.com/FezVrasta/popper.js/issues/373).
   *
   * @memberof modifiers
   * @inner
   */
  offset: {
    /** @prop {number} order=200 - Index used to define the order of execution */
    order: 200,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: ZC,
    /** @prop {Number|String} offset=0
     * The offset value as described in the modifier description
     */
    offset: 0
  },
  /**
   * Modifier used to prevent the popper from being positioned outside the boundary.
   *
   * A scenario exists where the reference itself is not within the boundaries.<br />
   * We can say it has "escaped the boundaries" — or just "escaped".<br />
   * In this case we need to decide whether the popper should either:
   *
   * - detach from the reference and remain "trapped" in the boundaries, or
   * - if it should ignore the boundary and "escape with its reference"
   *
   * When `escapeWithReference` is set to`true` and reference is completely
   * outside its boundaries, the popper will overflow (or completely leave)
   * the boundaries in order to remain attached to the edge of the reference.
   *
   * @memberof modifiers
   * @inner
   */
  preventOverflow: {
    /** @prop {number} order=300 - Index used to define the order of execution */
    order: 300,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: eS,
    /**
     * @prop {Array} [priority=['left','right','top','bottom']]
     * Popper will try to prevent overflow following these priorities by default,
     * then, it could overflow on the left and on top of the `boundariesElement`
     */
    priority: ["left", "right", "top", "bottom"],
    /**
     * @prop {number} padding=5
     * Amount of pixel used to define a minimum distance between the boundaries
     * and the popper. This makes sure the popper always has a little padding
     * between the edges of its container
     */
    padding: 5,
    /**
     * @prop {String|HTMLElement} boundariesElement='scrollParent'
     * Boundaries used by the modifier. Can be `scrollParent`, `window`,
     * `viewport` or any DOM element.
     */
    boundariesElement: "scrollParent"
  },
  /**
   * Modifier used to make sure the reference and its popper stay near each other
   * without leaving any gap between the two. Especially useful when the arrow is
   * enabled and you want to ensure that it points to its reference element.
   * It cares only about the first axis. You can still have poppers with margin
   * between the popper and its reference element.
   * @memberof modifiers
   * @inner
   */
  keepTogether: {
    /** @prop {number} order=400 - Index used to define the order of execution */
    order: 400,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: JC
  },
  /**
   * This modifier is used to move the `arrowElement` of the popper to make
   * sure it is positioned between the reference element and its popper element.
   * It will read the outer size of the `arrowElement` node to detect how many
   * pixels of conjunction are needed.
   *
   * It has no effect if no `arrowElement` is provided.
   * @memberof modifiers
   * @inner
   */
  arrow: {
    /** @prop {number} order=500 - Index used to define the order of execution */
    order: 500,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: YC,
    /** @prop {String|HTMLElement} element='[x-arrow]' - Selector or node used as arrow */
    element: "[x-arrow]"
  },
  /**
   * Modifier used to flip the popper's placement when it starts to overlap its
   * reference element.
   *
   * Requires the `preventOverflow` modifier before it in order to work.
   *
   * **NOTE:** this modifier will interrupt the current update cycle and will
   * restart it if it detects the need to flip the placement.
   * @memberof modifiers
   * @inner
   */
  flip: {
    /** @prop {number} order=600 - Index used to define the order of execution */
    order: 600,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: KC,
    /**
     * @prop {String|Array} behavior='flip'
     * The behavior used to change the popper's placement. It can be one of
     * `flip`, `clockwise`, `counterclockwise` or an array with a list of valid
     * placements (with optional variations)
     */
    behavior: "flip",
    /**
     * @prop {number} padding=5
     * The popper will flip if it hits the edges of the `boundariesElement`
     */
    padding: 5,
    /**
     * @prop {String|HTMLElement} boundariesElement='viewport'
     * The element which will define the boundaries of the popper position.
     * The popper will never be placed outside of the defined boundaries
     * (except if `keepTogether` is enabled)
     */
    boundariesElement: "viewport",
    /**
     * @prop {Boolean} flipVariations=false
     * The popper will switch placement variation between `-start` and `-end` when
     * the reference element overlaps its boundaries.
     *
     * The original placement should have a set variation.
     */
    flipVariations: !1,
    /**
     * @prop {Boolean} flipVariationsByContent=false
     * The popper will switch placement variation between `-start` and `-end` when
     * the popper element overlaps its reference boundaries.
     *
     * The original placement should have a set variation.
     */
    flipVariationsByContent: !1
  },
  /**
   * Modifier used to make the popper flow toward the inner of the reference element.
   * By default, when this modifier is disabled, the popper will be placed outside
   * the reference element.
   * @memberof modifiers
   * @inner
   */
  inner: {
    /** @prop {number} order=700 - Index used to define the order of execution */
    order: 700,
    /** @prop {Boolean} enabled=false - Whether the modifier is enabled or not */
    enabled: !1,
    /** @prop {ModifierFn} */
    fn: rS
  },
  /**
   * Modifier used to hide the popper when its reference element is outside of the
   * popper boundaries. It will set a `x-out-of-boundaries` attribute which can
   * be used to hide with a CSS selector the popper when its reference is
   * out of boundaries.
   *
   * Requires the `preventOverflow` modifier before it in order to work.
   * @memberof modifiers
   * @inner
   */
  hide: {
    /** @prop {number} order=800 - Index used to define the order of execution */
    order: 800,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: nS
  },
  /**
   * Computes the style that will be applied to the popper element to gets
   * properly positioned.
   *
   * Note that this modifier will not touch the DOM, it just prepares the styles
   * so that `applyStyle` modifier can apply it. This separation is useful
   * in case you need to replace `applyStyle` with a custom implementation.
   *
   * This modifier has `850` as `order` value to maintain backward compatibility
   * with previous versions of Popper.js. Expect the modifiers ordering method
   * to change in future major versions of the library.
   *
   * @memberof modifiers
   * @inner
   */
  computeStyle: {
    /** @prop {number} order=850 - Index used to define the order of execution */
    order: 850,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: WC,
    /**
     * @prop {Boolean} gpuAcceleration=true
     * If true, it uses the CSS 3D transformation to position the popper.
     * Otherwise, it will use the `top` and `left` properties
     */
    gpuAcceleration: !0,
    /**
     * @prop {string} [x='bottom']
     * Where to anchor the X axis (`bottom` or `top`). AKA X offset origin.
     * Change this if your popper should grow in a direction different from `bottom`
     */
    x: "bottom",
    /**
     * @prop {string} [x='left']
     * Where to anchor the Y axis (`left` or `right`). AKA Y offset origin.
     * Change this if your popper should grow in a direction different from `right`
     */
    y: "right"
  },
  /**
   * Applies the computed styles to the popper element.
   *
   * All the DOM manipulations are limited to this modifier. This is useful in case
   * you want to integrate Popper.js inside a framework or view library and you
   * want to delegate all the DOM manipulations to it.
   *
   * Note that if you disable this modifier, you must make sure the popper element
   * has its position set to `absolute` before Popper.js can do its work!
   *
   * Just disable this modifier and define your own to achieve the desired effect.
   *
   * @memberof modifiers
   * @inner
   */
  applyStyle: {
    /** @prop {number} order=900 - Index used to define the order of execution */
    order: 900,
    /** @prop {Boolean} enabled=true - Whether the modifier is enabled or not */
    enabled: !0,
    /** @prop {ModifierFn} */
    fn: BC,
    /** @prop {Function} */
    onLoad: HC,
    /**
     * @deprecated since version 1.10.0, the property moved to `computeStyle` modifier
     * @prop {Boolean} gpuAcceleration=true
     * If true, it uses the CSS 3D transformation to position the popper.
     * Otherwise, it will use the `top` and `left` properties
     */
    gpuAcceleration: void 0
  }
}, iS = {
  /**
   * Popper's placement.
   * @prop {Popper.placements} placement='bottom'
   */
  placement: "bottom",
  /**
   * Set this to true if you want popper to position it self in 'fixed' mode
   * @prop {Boolean} positionFixed=false
   */
  positionFixed: !1,
  /**
   * Whether events (resize, scroll) are initially enabled.
   * @prop {Boolean} eventsEnabled=true
   */
  eventsEnabled: !0,
  /**
   * Set to true if you want to automatically remove the popper when
   * you call the `destroy` method.
   * @prop {Boolean} removeOnDestroy=false
   */
  removeOnDestroy: !1,
  /**
   * Callback called when the popper is created.<br />
   * By default, it is set to no-op.<br />
   * Access Popper.js instance with `data.instance`.
   * @prop {onCreate}
   */
  onCreate: function() {
  },
  /**
   * Callback called when the popper is updated. This callback is not called
   * on the initialization/creation of the popper, but only on subsequent
   * updates.<br />
   * By default, it is set to no-op.<br />
   * Access Popper.js instance with `data.instance`.
   * @prop {onUpdate}
   */
  onUpdate: function() {
  },
  /**
   * List of modifiers used to modify the offsets before they are applied to the popper.
   * They provide most of the functionalities of Popper.js.
   * @prop {modifiers}
   */
  modifiers: aS
}, Co = function() {
  function e(t, n) {
    var r = this, a = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    NC(this, e), this.scheduleUpdate = function() {
      return requestAnimationFrame(r.update);
    }, this.update = DC(this.update.bind(this)), this.options = $n({}, e.Defaults, a), this.state = {
      isDestroyed: !1,
      isCreated: !1,
      scrollParents: []
    }, this.reference = t && t.jquery ? t[0] : t, this.popper = n && n.jquery ? n[0] : n, this.options.modifiers = {}, Object.keys($n({}, e.Defaults.modifiers, a.modifiers)).forEach(function(s) {
      r.options.modifiers[s] = $n({}, e.Defaults.modifiers[s] || {}, a.modifiers ? a.modifiers[s] : {});
    }), this.modifiers = Object.keys(this.options.modifiers).map(function(s) {
      return $n({
        name: s
      }, r.options.modifiers[s]);
    }).sort(function(s, c) {
      return s.order - c.order;
    }), this.modifiers.forEach(function(s) {
      s.enabled && hp(s.onLoad) && s.onLoad(r.reference, r.popper, r.options, s, r.state);
    }), this.update();
    var i = this.options.eventsEnabled;
    i && this.enableEventListeners(), this.state.eventsEnabled = i;
  }
  return RC(e, [{
    key: "update",
    value: function() {
      return MC.call(this);
    }
  }, {
    key: "destroy",
    value: function() {
      return $C.call(this);
    }
  }, {
    key: "enableEventListeners",
    value: function() {
      return _C.call(this);
    }
  }, {
    key: "disableEventListeners",
    value: function() {
      return VC.call(this);
    }
    /**
     * Schedules an update. It will run on the next UI update available.
     * @method scheduleUpdate
     * @memberof Popper
     */
    /**
     * Collection of utilities useful when writing custom modifiers.
     * Starting from version 1.7, this method is available only if you
     * include `popper-utils.js` before `popper.js`.
     *
     * **DEPRECATION**: This way to access PopperUtils is deprecated
     * and will be removed in v2! Use the PopperUtils module directly instead.
     * Due to the high instability of the methods contained in Utils, we can't
     * guarantee them to follow semver. Use them at your own risk!
     * @static
     * @private
     * @type {Object}
     * @deprecated since version 1.8
     * @member Utils
     * @memberof Popper
     */
  }]), e;
}();
Co.Utils = (typeof window < "u" ? window : global).PopperUtils;
Co.placements = Np;
Co.Defaults = iS;
function oS(e) {
  return e = typeof e == "function" ? e() : e, Zi.findDOMNode(e);
}
var Ps = typeof window < "u" ? le.useLayoutEffect : le.useEffect, sS = /* @__PURE__ */ le.forwardRef(function(t, n) {
  var r = t.children, a = t.container, i = t.disablePortal, s = i === void 0 ? !1 : i, c = t.onRendered, u = le.useState(null), p = u[0], g = u[1], v = Lr(/* @__PURE__ */ le.isValidElement(r) ? r.ref : null, n);
  return Ps(function() {
    s || g(oS(a) || document.body);
  }, [a, s]), Ps(function() {
    if (p && !s)
      return ca(n, p), function() {
        ca(n, null);
      };
  }, [n, p, s]), Ps(function() {
    c && (p || s) && c();
  }, [c, p, s]), s ? /* @__PURE__ */ le.isValidElement(r) ? /* @__PURE__ */ le.cloneElement(r, {
    ref: v
  }) : r : p && /* @__PURE__ */ Zi.createPortal(r, p);
});
function Yu() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return t.reduce(function(r, a) {
    return a == null ? r : function() {
      for (var s = arguments.length, c = new Array(s), u = 0; u < s; u++)
        c[u] = arguments[u];
      r.apply(this, c), a.apply(this, c);
    };
  }, function() {
  });
}
function lS(e, t) {
  var n = t && t.direction || "ltr";
  if (n === "ltr")
    return e;
  switch (e) {
    case "bottom-end":
      return "bottom-start";
    case "bottom-start":
      return "bottom-end";
    case "top-end":
      return "top-start";
    case "top-start":
      return "top-end";
    default:
      return e;
  }
}
function Gu(e) {
  return typeof e == "function" ? e() : e;
}
var cS = typeof window < "u" ? le.useLayoutEffect : le.useEffect, uS = {}, dS = /* @__PURE__ */ le.forwardRef(function(t, n) {
  var r = t.anchorEl, a = t.children, i = t.container, s = t.disablePortal, c = s === void 0 ? !1 : s, u = t.keepMounted, p = u === void 0 ? !1 : u, g = t.modifiers, v = t.open, y = t.placement, E = y === void 0 ? "bottom" : y, L = t.popperOptions, x = L === void 0 ? uS : L, C = t.popperRef, T = t.style, D = t.transition, k = D === void 0 ? !1 : D, N = Jt(t, ["anchorEl", "children", "container", "disablePortal", "keepMounted", "modifiers", "open", "placement", "popperOptions", "popperRef", "style", "transition"]), R = le.useRef(null), A = Lr(R, n), f = le.useRef(null), _ = Lr(f, C), O = le.useRef(_);
  cS(function() {
    O.current = _;
  }, [_]), le.useImperativeHandle(C, function() {
    return f.current;
  }, []);
  var J = le.useState(!0), ee = J[0], ge = J[1], ie = Lo(), fe = lS(E, ie), be = le.useState(fe), $e = be[0], Se = be[1];
  le.useEffect(function() {
    f.current && f.current.update();
  });
  var xe = le.useCallback(function() {
    if (!(!R.current || !r || !v)) {
      f.current && (f.current.destroy(), O.current(null));
      var Ze = function(nt) {
        Se(nt.placement);
      };
      Gu(r);
      var at = new Co(Gu(r), R.current, Z({
        placement: fe
      }, x, {
        modifiers: Z({}, c ? {} : {
          // It's using scrollParent by default, we can use the viewport when using a portal.
          preventOverflow: {
            boundariesElement: "window"
          }
        }, g, x.modifiers),
        // We could have been using a custom modifier like react-popper is doing.
        // But it seems this is the best public API for this use case.
        onCreate: Yu(Ze, x.onCreate),
        onUpdate: Yu(Ze, x.onUpdate)
      }));
      O.current(at);
    }
  }, [r, c, g, v, fe, x]), Te = le.useCallback(function(Ze) {
    ca(A, Ze), xe();
  }, [A, xe]), We = function() {
    ge(!1);
  }, Oe = function() {
    f.current && (f.current.destroy(), O.current(null));
  }, Ne = function() {
    ge(!0), Oe();
  };
  if (le.useEffect(function() {
    return function() {
      Oe();
    };
  }, []), le.useEffect(function() {
    !v && !k && Oe();
  }, [v, k]), !p && !v && (!k || ee))
    return null;
  var Me = {
    placement: $e
  };
  return k && (Me.TransitionProps = {
    in: v,
    onEnter: We,
    onExited: Ne
  }), /* @__PURE__ */ le.createElement(sS, {
    disablePortal: c,
    container: i
  }, /* @__PURE__ */ le.createElement("div", Z({
    ref: Te,
    role: "tooltip"
  }, N, {
    style: Z({
      // Prevents scroll issue, waiting for Popper.js to add this style once initiated.
      position: "fixed",
      // Fix Popper.js display issue
      top: 0,
      left: 0,
      display: !v && p && !k ? "none" : null
    }, T)
  }), typeof a == "function" ? a(Me) : a));
});
function fS(e) {
  var t = le.useState(e), n = t[0], r = t[1], a = e || n;
  return le.useEffect(function() {
    n == null && r("mui-".concat(Math.round(Math.random() * 1e5)));
  }, [n]), a;
}
var So = !0, fl = !1, Ku = null, pS = {
  text: !0,
  search: !0,
  url: !0,
  tel: !0,
  email: !0,
  password: !0,
  number: !0,
  date: !0,
  month: !0,
  week: !0,
  time: !0,
  datetime: !0,
  "datetime-local": !0
};
function mS(e) {
  var t = e.type, n = e.tagName;
  return !!(n === "INPUT" && pS[t] && !e.readOnly || n === "TEXTAREA" && !e.readOnly || e.isContentEditable);
}
function gS(e) {
  e.metaKey || e.altKey || e.ctrlKey || (So = !0);
}
function Ns() {
  So = !1;
}
function hS() {
  this.visibilityState === "hidden" && fl && (So = !0);
}
function vS(e) {
  e.addEventListener("keydown", gS, !0), e.addEventListener("mousedown", Ns, !0), e.addEventListener("pointerdown", Ns, !0), e.addEventListener("touchstart", Ns, !0), e.addEventListener("visibilitychange", hS, !0);
}
function yS(e) {
  var t = e.target;
  try {
    return t.matches(":focus-visible");
  } catch {
  }
  return So || mS(t);
}
function bS() {
  fl = !0, window.clearTimeout(Ku), Ku = window.setTimeout(function() {
    fl = !1;
  }, 100);
}
function wS() {
  var e = le.useCallback(function(t) {
    var n = Zi.findDOMNode(t);
    n != null && vS(n.ownerDocument);
  }, []);
  return {
    isFocusVisible: yS,
    onBlurVisible: bS,
    ref: e
  };
}
function xS(e) {
  var t = e.controlled, n = e.default, r = le.useRef(t !== void 0), a = r.current, i = le.useState(n), s = i[0], c = i[1], u = a ? t : s, p = le.useCallback(function(g) {
    a || c(g);
  }, []);
  return [u, p];
}
function Ju(e) {
  return Math.round(e * 1e5) / 1e5;
}
function ES() {
  return {
    '&[x-placement*="bottom"] $arrow': {
      top: 0,
      left: 0,
      marginTop: "-0.71em",
      marginLeft: 4,
      marginRight: 4,
      "&::before": {
        transformOrigin: "0 100%"
      }
    },
    '&[x-placement*="top"] $arrow': {
      bottom: 0,
      left: 0,
      marginBottom: "-0.71em",
      marginLeft: 4,
      marginRight: 4,
      "&::before": {
        transformOrigin: "100% 0"
      }
    },
    '&[x-placement*="right"] $arrow': {
      left: 0,
      marginLeft: "-0.71em",
      height: "1em",
      width: "0.71em",
      marginTop: 4,
      marginBottom: 4,
      "&::before": {
        transformOrigin: "100% 100%"
      }
    },
    '&[x-placement*="left"] $arrow': {
      right: 0,
      marginRight: "-0.71em",
      height: "1em",
      width: "0.71em",
      marginTop: 4,
      marginBottom: 4,
      "&::before": {
        transformOrigin: "0 0"
      }
    }
  };
}
var LS = function(t) {
  return {
    /* Styles applied to the Popper component. */
    popper: {
      zIndex: t.zIndex.tooltip,
      pointerEvents: "none"
      // disable jss-rtl plugin
    },
    /* Styles applied to the Popper component if `interactive={true}`. */
    popperInteractive: {
      pointerEvents: "auto"
    },
    /* Styles applied to the Popper component if `arrow={true}`. */
    popperArrow: ES(),
    /* Styles applied to the tooltip (label wrapper) element. */
    tooltip: {
      backgroundColor: yu(t.palette.grey[700], 0.9),
      borderRadius: t.shape.borderRadius,
      color: t.palette.common.white,
      fontFamily: t.typography.fontFamily,
      padding: "4px 8px",
      fontSize: t.typography.pxToRem(10),
      lineHeight: "".concat(Ju(14 / 10), "em"),
      maxWidth: 300,
      wordWrap: "break-word",
      fontWeight: t.typography.fontWeightMedium
    },
    /* Styles applied to the tooltip (label wrapper) element if `arrow={true}`. */
    tooltipArrow: {
      position: "relative",
      margin: "0"
    },
    /* Styles applied to the arrow element. */
    arrow: {
      overflow: "hidden",
      position: "absolute",
      width: "1em",
      height: "0.71em",
      boxSizing: "border-box",
      color: yu(t.palette.grey[700], 0.9),
      "&::before": {
        content: '""',
        margin: "auto",
        display: "block",
        width: "100%",
        height: "100%",
        backgroundColor: "currentColor",
        transform: "rotate(45deg)"
      }
    },
    /* Styles applied to the tooltip (label wrapper) element if the tooltip is opened by touch. */
    touch: {
      padding: "8px 16px",
      fontSize: t.typography.pxToRem(14),
      lineHeight: "".concat(Ju(16 / 14), "em"),
      fontWeight: t.typography.fontWeightRegular
    },
    /* Styles applied to the tooltip (label wrapper) element if `placement` contains "left". */
    tooltipPlacementLeft: Mn({
      transformOrigin: "right center",
      margin: "0 24px "
    }, t.breakpoints.up("sm"), {
      margin: "0 14px"
    }),
    /* Styles applied to the tooltip (label wrapper) element if `placement` contains "right". */
    tooltipPlacementRight: Mn({
      transformOrigin: "left center",
      margin: "0 24px"
    }, t.breakpoints.up("sm"), {
      margin: "0 14px"
    }),
    /* Styles applied to the tooltip (label wrapper) element if `placement` contains "top". */
    tooltipPlacementTop: Mn({
      transformOrigin: "center bottom",
      margin: "24px 0"
    }, t.breakpoints.up("sm"), {
      margin: "14px 0"
    }),
    /* Styles applied to the tooltip (label wrapper) element if `placement` contains "bottom". */
    tooltipPlacementBottom: Mn({
      transformOrigin: "center top",
      margin: "24px 0"
    }, t.breakpoints.up("sm"), {
      margin: "14px 0"
    })
  };
}, bi = !1, Rs = null, CS = /* @__PURE__ */ le.forwardRef(function(t, n) {
  var r = t.arrow, a = r === void 0 ? !1 : r, i = t.children, s = t.classes, c = t.disableFocusListener, u = c === void 0 ? !1 : c, p = t.disableHoverListener, g = p === void 0 ? !1 : p, v = t.disableTouchListener, y = v === void 0 ? !1 : v, E = t.enterDelay, L = E === void 0 ? 100 : E, x = t.enterNextDelay, C = x === void 0 ? 0 : x, T = t.enterTouchDelay, D = T === void 0 ? 700 : T, k = t.id, N = t.interactive, R = N === void 0 ? !1 : N, A = t.leaveDelay, f = A === void 0 ? 0 : A, _ = t.leaveTouchDelay, O = _ === void 0 ? 1500 : _, J = t.onClose, ee = t.onOpen, ge = t.open, ie = t.placement, fe = ie === void 0 ? "bottom" : ie, be = t.PopperComponent, $e = be === void 0 ? dS : be, Se = t.PopperProps, xe = t.title, Te = t.TransitionComponent, We = Te === void 0 ? gp : Te, Oe = t.TransitionProps, Ne = Jt(t, ["arrow", "children", "classes", "disableFocusListener", "disableHoverListener", "disableTouchListener", "enterDelay", "enterNextDelay", "enterTouchDelay", "id", "interactive", "leaveDelay", "leaveTouchDelay", "onClose", "onOpen", "open", "placement", "PopperComponent", "PopperProps", "title", "TransitionComponent", "TransitionProps"]), Me = mp(), Ze = le.useState(), at = Ze[0], He = Ze[1], nt = le.useState(null), yt = nt[0], Ct = nt[1], rt = le.useRef(!1), mt = le.useRef(), dt = le.useRef(), Ie = le.useRef(), Ue = le.useRef(), Xe = xS({
    controlled: ge,
    default: !1
  }), ae = Vn(Xe, 2), oe = ae[0], we = ae[1], De = oe, ue = fS(k);
  le.useEffect(function() {
    return function() {
      clearTimeout(mt.current), clearTimeout(dt.current), clearTimeout(Ie.current), clearTimeout(Ue.current);
    };
  }, []);
  var ne = function(de) {
    clearTimeout(Rs), bi = !0, we(!0), ee && ee(de);
  }, he = function() {
    var de = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0;
    return function(Fe) {
      var Be = i.props;
      Fe.type === "mouseover" && Be.onMouseOver && de && Be.onMouseOver(Fe), !(rt.current && Fe.type !== "touchstart") && (at && at.removeAttribute("title"), clearTimeout(dt.current), clearTimeout(Ie.current), L || bi && C ? (Fe.persist(), dt.current = setTimeout(function() {
        ne(Fe);
      }, bi ? C : L)) : ne(Fe));
    };
  }, et = wS(), se = et.isFocusVisible, G = et.onBlurVisible, Re = et.ref, bt = le.useState(!1), St = bt[0], an = bt[1], ct = function() {
    St && (an(!1), G());
  }, yn = function() {
    var de = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0;
    return function(Fe) {
      at || He(Fe.currentTarget), se(Fe) && (an(!0), he()(Fe));
      var Be = i.props;
      Be.onFocus && de && Be.onFocus(Fe);
    };
  }, un = function(de) {
    clearTimeout(Rs), Rs = setTimeout(function() {
      bi = !1;
    }, 800 + f), we(!1), J && J(de), clearTimeout(mt.current), mt.current = setTimeout(function() {
      rt.current = !1;
    }, Me.transitions.duration.shortest);
  }, Ot = function() {
    var de = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : !0;
    return function(Fe) {
      var Be = i.props;
      Fe.type === "blur" && (Be.onBlur && de && Be.onBlur(Fe), ct()), Fe.type === "mouseleave" && Be.onMouseLeave && Fe.currentTarget === at && Be.onMouseLeave(Fe), clearTimeout(dt.current), clearTimeout(Ie.current), Fe.persist(), Ie.current = setTimeout(function() {
        un(Fe);
      }, f);
    };
  }, Ht = function(de) {
    rt.current = !0;
    var Fe = i.props;
    Fe.onTouchStart && Fe.onTouchStart(de);
  }, dn = function(de) {
    Ht(de), clearTimeout(Ie.current), clearTimeout(mt.current), clearTimeout(Ue.current), de.persist(), Ue.current = setTimeout(function() {
      he()(de);
    }, D);
  }, Dn = function(de) {
    i.props.onTouchEnd && i.props.onTouchEnd(de), clearTimeout(Ue.current), clearTimeout(Ie.current), de.persist(), Ie.current = setTimeout(function() {
      un(de);
    }, O);
  }, Qt = Lr(He, n), kn = Lr(Re, Qt), Rn = le.useCallback(function(te) {
    ca(kn, Zi.findDOMNode(te));
  }, [kn]), dr = Lr(i.ref, Rn);
  xe === "" && (De = !1);
  var En = !De && !g, Xt = Z({
    "aria-describedby": De ? ue : null,
    title: En && typeof xe == "string" ? xe : null
  }, Ne, i.props, {
    className: ls(Ne.className, i.props.className),
    onTouchStart: Ht,
    ref: dr
  }), zt = {};
  y || (Xt.onTouchStart = dn, Xt.onTouchEnd = Dn), g || (Xt.onMouseOver = he(), Xt.onMouseLeave = Ot(), R && (zt.onMouseOver = he(!1), zt.onMouseLeave = Ot(!1))), u || (Xt.onFocus = yn(), Xt.onBlur = Ot(), R && (zt.onFocus = yn(!1), zt.onBlur = Ot(!1)));
  var fr = le.useMemo(function() {
    return Vr({
      popperOptions: {
        modifiers: {
          arrow: {
            enabled: !!yt,
            element: yt
          }
        }
      }
    }, Se);
  }, [yt, Se]);
  return /* @__PURE__ */ le.createElement(le.Fragment, null, /* @__PURE__ */ le.cloneElement(i, Xt), /* @__PURE__ */ le.createElement($e, Z({
    className: ls(s.popper, R && s.popperInteractive, a && s.popperArrow),
    placement: fe,
    anchorEl: at,
    open: at ? De : !1,
    id: Xt["aria-describedby"],
    transition: !0
  }, zt, fr), function(te) {
    var de = te.placement, Fe = te.TransitionProps;
    return /* @__PURE__ */ le.createElement(We, Z({
      timeout: Me.transitions.duration.shorter
    }, Fe, Oe), /* @__PURE__ */ le.createElement("div", {
      className: ls(s.tooltip, s["tooltipPlacement".concat(bC(de.split("-")[0]))], rt.current && s.touch, a && s.tooltipArrow)
    }, xe, a ? /* @__PURE__ */ le.createElement("span", {
      className: s.arrow,
      ref: Ct
    }) : null));
  }));
});
const Rp = yC(LS, {
  name: "MuiTooltip",
  flip: !1
})(CS), tc = ({ label: e = 'Enter\x20atleast\x203\x20characters\x2e\x20e\x2eg\x2e\x2c\x20tax\x20or\x20TDS' }) => {
  const [t, n] = V(!1), r = () => n(!1), a = () => n(!0), i = Liferay.Icons.spritemap;
  return /* @__PURE__ */ l.createElement(jr, { spritemap: i }, /* @__PURE__ */ l.createElement(
    Rp,
    {
      title: e,
      placement: "top",
      arrow: !0,
      open: t,
      onClose: r
    },
    /* @__PURE__ */ l.createElement(
      "span",
      {
        className: "label-tooltip-icon-wrap ml-1",
        tabIndex: "0",
        onMouseEnter: a,
        onMouseLeave: r,
        onFocus: a,
        onBlur: r,
        onClick: a
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-info-sm" }),
      /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, "info icon ", e)
    )
  ));
}, iD = ({
  id: e = "Search-input",
  label: t = 'Search',
  maxLength: n = "255",
  placeholder: r = 'Type\x20to\x20search',
  name: a = "Search",
  value: i = "",
  handleChange: s,
  showSearchIcon: c = !0,
  info: u = 'Enter\x20atleast\x203\x20characters\x2e\x20e\x2eg\x2e\x2c\x20tax\x20or\x20TDS',
  ...p
}) => {
  const g = () => i.trim().length < 3 && i.trim() !== "", v = `${t}-${e}`;
  return /* @__PURE__ */ l.createElement(
    "div",
    {
      className: `form-group-item ${g() > 0 ? "error-wrapper" : ""}`
    },
    /* @__PURE__ */ l.createElement("div", { className: "control-label text-truncate d-flex" }, /* @__PURE__ */ l.createElement("label", { htmlFor: v, title: t }, t), u && /* @__PURE__ */ l.createElement(tc, { label: u })),
    /* @__PURE__ */ l.createElement("div", { className: "position-relative" }, /* @__PURE__ */ l.createElement(
      "input",
      {
        id: v,
        type: "text",
        name: a,
        className: "form-control with-right-icon",
        placeholder: r,
        value: i,
        maxLength: n,
        onChange: s,
        onBlur: s,
        onFocus: s,
        onKeyDown: (y) => {
          var E;
          y.key === "Enter" && ((E = document.querySelector(".search-wrapper .action-buttons .btn.btn-primary")) == null || E.click());
        },
        ...p
      }
    ), c && /* @__PURE__ */ l.createElement(re, { symbol: "etds-search", className: "form-control-icon" })),
    g() && /* @__PURE__ */ l.createElement("span", { "aria-live": "assertive", role: "alert", className: "custom-error" }, /* @__PURE__ */ l.createElement(re, { symbol: "info-circle" }), "  ", 'Please\x20enter\x20at\x20least\x203\x20characters')
  );
}, oD = ({
  id: e = "Form-input",
  placeholder: t = 'Enter\x20Number',
  label: n = 'Form\x20Number',
  name: r = "Form",
  value: a = "",
  handleChange: i,
  isMandatory: s = !1,
  maxLength: c,
  messageLength: u = 0,
  errorMessage: p = "",
  showSearchIcon: g = !1,
  ...v
}) => {
  const y = () => a.length < u && a !== "", E = `${n}-${e}`;
  return /* @__PURE__ */ l.createElement("div", { className: `etds-form-input-text form-group-item ${p !== "" && y() > 0 ? "error-wrapper" : ""}` }, /* @__PURE__ */ l.createElement("label", { className: "control-label text-truncate d-flex", htmlFor: E, title: n }, n, " ", s && /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-hidden": "true" }, "*")), /* @__PURE__ */ l.createElement("div", { className: "position-relative" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      type: "text",
      name: r,
      id: E,
      className: `form-control ${g ? "with-right-icon" : ""}`,
      placeholder: t,
      value: a,
      "aria-invalid": p !== "",
      ...p && { "aria-describedby": "search-input-error" },
      onChange: i,
      "aria-required": !!s,
      ...c ? { maxLength: c } : {},
      ...v
    }
  ), g && /* @__PURE__ */ l.createElement(re, { symbol: "etds-search", className: "form-control-icon" })), p !== "" && y() && /* @__PURE__ */ l.createElement("span", { id: "search-input-error", "aria-live": "assertive", role: "alert", className: "custom-error" }, /* @__PURE__ */ l.createElement(re, { symbol: "info-circle" }), " ", p));
}, SS = ({ children: e, classNames: t = "" }) => /* @__PURE__ */ l.createElement("div", { className: `form-group-autofit ${t}` }, e), TS = ({
  classNames: e = "",
  handleClick: t,
  label: n = 'Search',
  ...r
}) => /* @__PURE__ */ l.createElement(
  "button",
  {
    className: `btn ${e}`,
    type: "button",
    onClick: t,
    ...r
  },
  n
), DS = ({ children: e, isAutofit: t = !0, classNames: n = "", newsLetterSubscribe: r = !1 }) => /* @__PURE__ */ l.createElement("div", { className: `form-group-item${t ? "-autofit" : ""} ${n}` }, !r && /* @__PURE__ */ l.createElement("div", { className: "control-label text-truncate" }, " "), /* @__PURE__ */ l.createElement("div", { className: "action-buttons" }, " ", e)), sD = ({
  children: e,
  tabStyle: t = !0,
  tabLabel: n = 'Search',
  lastUpdatedDate: r = !1,
  classNames: a = "",
  tabCategories: i = [],
  activeTabCategory: s,
  setActiveTabCategory: c,
  newsLetterSubscribe: u = !1,
  tabStyleClass: p = "tab-style",
  labelSection: g = !1,
  firstLabel: v = 'Enter\x20any\x20of\x20the\x20Following\x2e',
  secondLabel: y = '\x28Click\x20on\x20the\x20links\x20below\x20to\x20view\x20the\x20location\x29',
  externalRedirectionLabel: E = "",
  externalRedirectionLink: L = "",
  subTabLabel: x = "",
  documentView: C = !1,
  printFrameRef: T = null,
  defaultFilterContentMessage: D = 'Below\x20results\x20are\x20only\x20the\x20related\x20contents\x2e\x20Click\x20here\x20to',
  showFilteredMessage: k = !0
}) => {
  const N = _e([]), R = (f) => {
    (f.key === "Enter" || f.key === " ") && (f.preventDefault(), Qu(L, T));
  }, A = (f, _) => {
    var ee, ge;
    const O = i.length - 1;
    let J = _;
    if (f.key === "ArrowRight")
      J = _ === O ? 0 : _ + 1;
    else if (f.key === "ArrowLeft")
      J = _ === 0 ? O : _ - 1;
    else if (f.key === "Home")
      J = 0;
    else if (f.key === "End")
      J = O;
    else if (f.key === "Enter" || f.key === " ") {
      f.preventDefault(), c(i[_].id);
      return;
    } else
      return;
    f.preventDefault(), (ee = N.current[J]) == null || ee.focus(), (ge = N.current[J]) == null || ge.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };
  return /* @__PURE__ */ l.createElement("div", { className: `search-wrapper ${a}` }, /* @__PURE__ */ l.createElement("div", { className: "search-box border-0 mb-0" }, i.length > 0 && /* @__PURE__ */ l.createElement("ul", { className: "tab-style", role: "tablist" }, i.map((f, _) => {
    const O = f.id === s ? "active" : "";
    return /* @__PURE__ */ l.createElement(
      "li",
      {
        key: f.id,
        className: O,
        role: "presentation"
      },
      /* @__PURE__ */ l.createElement(
        "button",
        {
          role: "tab",
          ref: (J) => N.current[_] = J,
          "aria-selected": "false",
          "aria-posinset": _ + 1,
          "aria-setsize": i.length,
          tabIndex: f.id === s ? 0 : -1,
          onKeyDown: (J) => A(J, _),
          "aria-label": f.id === s ? `${f.name} ${'Selected'}` : `${f.name} ${'Not\x20Selected'}`,
          onClick: () => c(f.id)
        },
        f.name
      )
    );
  })), t && L === "" && /* @__PURE__ */ l.createElement("div", { className: p }, /* @__PURE__ */ l.createElement("h2", { className: "h5" }, n), x && /* @__PURE__ */ l.createElement("p", null, x)), t && L !== "" && /* @__PURE__ */ l.createElement("div", { className: `${p} etds-title-with-redirection-link` }, /* @__PURE__ */ l.createElement("h5", null, n), C === !0 ? /* @__PURE__ */ l.createElement("div", { tabIndex: 0, onClick: () => Qu(L, T), onKeyDown: R, className: "etds-redirection-link cursor-pointer", role: "link" }, /* @__PURE__ */ l.createElement("span", { className: "mr-2" }, E), /* @__PURE__ */ l.createElement(re, { symbol: "etds-external-link-x15" })) : /* @__PURE__ */ l.createElement("a", { href: L, className: "etds-redirection-link cursor-pointer", role: "link" }, /* @__PURE__ */ l.createElement("span", { className: "mr-2" }, E), /* @__PURE__ */ l.createElement(re, { symbol: "etds-external-link-x15" }))), g && /* @__PURE__ */ l.createElement("div", { className: `mb-3 pb-1 border-0 ${p}` }, /* @__PURE__ */ l.createElement("span", { className: "fst-lbl" }, v), /* @__PURE__ */ l.createElement("span", { className: "sec-lbl" }, y)), e, k && /* @__PURE__ */ l.createElement(kS, { defaultFilterContentMessage: D })), r && /* @__PURE__ */ l.createElement(l.Fragment, null, " ", 'etds-display-last-update-date', " "));
}, Qu = async (e, t) => {
  try {
    await F.showContent(e, t);
  } catch (n) {
    console.error("Failed to show content:", n);
  }
}, kS = ({
  defaultFilterContentMessage: e = 'Below\x20results\x20are\x20only\x20the\x20related\x20contents\x2e\x20Click\x20here\x20to',
  contentMessage: t = 'contents\x2e'
}) => {
  const n = rn(() => {
    const a = new URLSearchParams(window.location.search);
    return a.has("related_content_Id") || a.has("categoryId");
  }, []), r = () => {
    const a = new URL(window.location.href);
    a.search = "", window.history.replaceState({}, document.title, a.pathname), window.location.reload();
  };
  return /* @__PURE__ */ l.createElement(l.Fragment, null, n && /* @__PURE__ */ l.createElement("div", { className: "info-banner d-flex mt-2" }, /* @__PURE__ */ l.createElement("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ l.createElement(
    "path",
    {
      d: "M9.16699 14.166H10.8337V9.16602H9.16699V14.166ZM10.0003 7.49935C10.2364 7.49935 10.4344 7.41949 10.5941 7.25977C10.7538 7.10004 10.8337 6.90213 10.8337 6.66602C10.8337 6.4299 10.7538 6.23199 10.5941 6.07227C10.4344 5.91254 10.2364 5.83268 10.0003 5.83268C9.76421 5.83268 9.5663 5.91254 9.40658 6.07227C9.24685 6.23199 9.16699 6.4299 9.16699 6.66602C9.16699 6.90213 9.24685 7.10004 9.40658 7.25977C9.5663 7.41949 9.76421 7.49935 10.0003 7.49935ZM10.0003 18.3327C8.84755 18.3327 7.76421 18.1139 6.75033 17.6764C5.73644 17.2389 4.85449 16.6452 4.10449 15.8952C3.35449 15.1452 2.76074 14.2632 2.32324 13.2493C1.88574 12.2355 1.66699 11.1521 1.66699 9.99935C1.66699 8.84657 1.88574 7.76324 2.32324 6.74935C2.76074 5.73546 3.35449 4.85352 4.10449 4.10352C4.85449 3.35352 5.73644 2.75977 6.75033 2.32227C7.76421 1.88477 8.84755 1.66602 10.0003 1.66602C11.1531 1.66602 12.2364 1.88477 13.2503 2.32227C14.2642 2.75977 15.1462 3.35352 15.8962 4.10352C16.6462 4.85352 17.2399 5.73546 17.6774 6.74935C18.1149 7.76324 18.3337 8.84657 18.3337 9.99935C18.3337 11.1521 18.1149 12.2355 17.6774 13.2493C17.2399 14.2632 16.6462 15.1452 15.8962 15.8952C15.1462 16.6452 14.2642 17.2389 13.2503 17.6764C12.2364 18.1139 11.1531 18.3327 10.0003 18.3327ZM10.0003 16.666C11.8614 16.666 13.4378 16.0202 14.7295 14.7285C16.0212 13.4368 16.667 11.8605 16.667 9.99935C16.667 8.13824 16.0212 6.56185 14.7295 5.27018C13.4378 3.97852 11.8614 3.33268 10.0003 3.33268C8.13921 3.33268 6.56283 3.97852 5.27116 5.27018C3.97949 6.56185 3.33366 8.13824 3.33366 9.99935C3.33366 11.8605 3.97949 13.4368 5.27116 14.7285C6.56283 16.0202 8.13921 16.666 10.0003 16.666Z",
      fill: "currentColor"
    }
  )), /* @__PURE__ */ l.createElement("div", null, /* @__PURE__ */ l.createElement("strong", null, /* @__PURE__ */ l.createElement("span", null, 'Information'), /* @__PURE__ */ l.createElement("span", null, ": ")), /* @__PURE__ */ l.createElement("span", null, e, " ", /* @__PURE__ */ l.createElement("a", { href: "", onClick: r }, 'view\x20all'), " ", t))));
}, lD = ({ activeTabId: e, setActiveTabId: t, tabList: n }) => {
  if (!n || n.length === 0) return null;
  const r = (a, i) => {
    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(a.key) && a.preventDefault(), a.key === "ArrowRight" && document.getElementById(`tab-${n[(i + 1) % n.length].id}`).focus(), a.key === "ArrowLeft" && document.getElementById(
      `tab-${n[(i - 1 + n.length) % n.length].id}`
    ).focus(), a.key === "Home" && document.getElementById(`tab-${n[0].id}`).focus(), a.key === "End" && document.getElementById(`tab-${n[n.length - 1].id}`).focus();
  };
  return /* @__PURE__ */ l.createElement("ul", { className: "tab-style", role: "tablist" }, n.map((a, i) => /* @__PURE__ */ l.createElement(
    "li",
    {
      key: a.id,
      className: e === a.id ? "active" : "",
      role: "presentation"
    },
    /* @__PURE__ */ l.createElement(
      "button",
      {
        id: `tab-${a.id}`,
        role: "tab",
        "aria-selected": "false",
        "aria-controls": `panel-${a.id}`,
        tabIndex: e === a.id ? 0 : -1,
        "aria-label": e === a.id ? `${a.label} ${'Selected'}` : `${a.label} ${'Not\x20Selected'}`,
        onClick: () => t(a.id),
        onKeyDown: (s) => r(s, i)
      },
      a.icon && /* @__PURE__ */ l.createElement(re, { symbol: a.icon }),
      a.label
    )
  )));
}, cD = ({ children: e, classNames: t = "", informationAlert: n = "", pageTitle: r, isMandatory: a = !1, isMandatoryBlack: i = !1, ...s }) => /* @__PURE__ */ l.createElement(
  "div",
  {
    className: `etds-page-main-content fixed-width ${t}`,
    role: "region",
    "aria-label": r,
    ...s
  },
  r && /* @__PURE__ */ l.createElement("div", { className: "page-title-wrap" }, /* @__PURE__ */ l.createElement("h1", { className: "page-title h3" }, r), n !== "" && /* @__PURE__ */ l.createElement("div", { className: "etds-alert-box p-0" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-info-sm" }), /* @__PURE__ */ l.createElement("span", null, /* @__PURE__ */ l.createElement("strong", null, 'Information', " "), n)), a && /* @__PURE__ */ l.createElement("div", { className: `contains_mandatory ml-auto ${i && "contains_mandatory--text-black"}` }, /* @__PURE__ */ l.createElement("span", { className: "asterisk" }, "*"), '\x2a\x20Indicates\x20mandatory\x20fields')),
  e
), uD = ({ children: e, className: t = "", ...n }) => /* @__PURE__ */ l.createElement("div", { className: `page-content-wrap ${t}`, ...n }, e), dD = ({
  noReports: e = !1,
  noReportsIcon: t = "etds-no-results",
  noReportsTitle: n = 'No\x20Result\x20Found',
  noReportsSubTitlte: r = 'Please\x20adjust\x20filters',
  announce: a = !0
}) => (ye(() => {
  if (!a) return;
  F == null || F.announceScreenReaderMessage(n);
  const i = setTimeout(() => {
    F == null || F.announceScreenReaderMessage("");
  }, 1e3);
  return () => clearTimeout(i);
}, [a]), /* @__PURE__ */ l.createElement("div", { class: "no-results-wrapper", role: "status" }, /* @__PURE__ */ l.createElement(
  re,
  {
    symbol: t,
    className: "no-result-icon",
    role: "img",
    "aria-label": 'No\x20results\x20found\x2e\x20Adjust\x20filters\x2e'
  }
), /* @__PURE__ */ l.createElement("p", { class: `no-result-title h4 ${e && "text-muted"}`, "aria-label": 'No\x20Result\x20Found' }, n), e ? /* @__PURE__ */ l.createElement(l.Fragment, null) : /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("p", { class: "adjust-filter-text", "aria-label": 'Please\x20adjust\x20filters' }, r)))), nc = () => /* @__PURE__ */ l.createElement("div", { className: "loader-section d-flex justify-space-between align-items-center" }, /* @__PURE__ */ l.createElement(fd, { displayType: "secondary", size: "sm" })), wi = "list", Pi = "tile", fD = ({
  viewType: e,
  setViewType: t,
  listLabel: n = 'List\x20View',
  tileLabel: r = 'Tile\x20View',
  viewLabel: a = 'View',
  isTileViewDisabled: i = !1
}) => {
  const s = (c) => {
    localStorage.setItem("sectionViewType", c), t(c);
    const u = c === wi ? `${'View\x20changed\x20to'} ${n}` : `${'View\x20changed\x20to'} ${r}`;
    F == null || F.announceScreenReaderMessage(u), setTimeout(() => F == null ? void 0 : F.announceScreenReaderMessage(""), 1e3);
  };
  return /* @__PURE__ */ l.createElement("div", { className: "views-wrap type-2", role: "group", "aria-label": `${a} ${'Type'}` }, /* @__PURE__ */ l.createElement("span", { className: "title", "aria-hidden": "true" }, a), /* @__PURE__ */ l.createElement("div", { className: "actions" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      id: "listView",
      type: "button",
      onClick: () => s(wi),
      className: e === wi ? "active" : "",
      "aria-pressed": e === wi
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-list-view" }),
    /* @__PURE__ */ l.createElement("span", { className: "text" }, n)
  ), /* @__PURE__ */ l.createElement(
    "button",
    {
      id: "yearView",
      type: "button",
      onClick: () => s(Pi),
      className: e === Pi ? "active" : "",
      disabled: i,
      "aria-pressed": e === Pi
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-tile-view" }),
    /* @__PURE__ */ l.createElement("span", { className: "text" }, r)
  )));
}, pD = ({ alphaSort: e, handleSortOrder: t }) => /* @__PURE__ */ l.createElement("div", { className: "sort-wrap" }, /* @__PURE__ */ l.createElement("span", { className: "title" }, 'Alphabetical'), /* @__PURE__ */ l.createElement("div", { className: "actions" }, /* @__PURE__ */ l.createElement(
  "button",
  {
    id: "alphaSort",
    type: "button",
    onClick: t,
    className: `active ${e ? "alpha-sort-asc" : "alpha-sort-desc"}`
  },
  /* @__PURE__ */ l.createElement(re, { symbol: "etds-alphabetical-sort" }),
  /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, e ? 'Sort\x20Descending' : 'Sort\x20Ascending')
))), Ip = ({ id: e, displayType: t = "", ariaLabel: n = "" }) => {
  const [r, a] = V(!1), i = _e({}), s = async () => {
    window.showLoader(), a(!0);
    try {
      await F.downloadContentPdf(e, i);
    } catch (u) {
      console.error("Download failed:", u);
    } finally {
      window.hideLoader(), a(!1);
    }
  };
  let c = /* @__PURE__ */ l.createElement(
    "button",
    {
      type: "button",
      className: "download",
      onClick: s,
      disabled: r,
      "aria-label": n || 'Download\x20PDF'
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-download" }),
    /* @__PURE__ */ l.createElement("span", { className: "text" }, 'Download\x20PDF')
  );
  return t === "sidebar" && (c = /* @__PURE__ */ l.createElement("div", { className: "additional-action" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      className: `title-wrap open-false ${r ? "disabled" : ""}`,
      onClick: r ? void 0 : s,
      disabled: r,
      style: {
        cursor: r ? "not-allowed" : "pointer",
        opacity: r ? 0.6 : 1,
        pointerEvents: r ? "none" : "auto"
      },
      "aria-label": `${'Download\x20PDF'}, ${'Graphic'}`,
      title: 'Download\x20PDF'
    },
    /* @__PURE__ */ l.createElement("div", { className: "title text-truncate" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-download" }), /* @__PURE__ */ l.createElement(
      "span",
      {
        className: "title-text text-truncate",
        title: 'Download\x20PDF'
      },
      'Download\x20PDF'
    ))
  ))), c;
}, To = ({ handleSidebarClick: e }) => /* @__PURE__ */ l.createElement("div", { className: "top-element" }, /* @__PURE__ */ l.createElement("div", { className: "site-name-wrap" }, /* @__PURE__ */ l.createElement("p", { className: "site-name", id: "clay-modal-label-1" }, 'Income\x20Tax\x20Department'), /* @__PURE__ */ l.createElement("p", { className: "tagline" }, 'Ministry\x20of\x20Finance\x2c\x20Government\x20of\x20India')), /* @__PURE__ */ l.createElement("button", { className: "reset-btn-style", id: "sidebar-modal-btn", onClick: e, "aria-label": 'Close\x20Menu' }, /* @__PURE__ */ l.createElement(re, { className: "collapse-sidebar-btn", symbol: "etds-close-lg" }), /* @__PURE__ */ l.createElement(re, { className: "sidebar-icon", symbol: "etds-hamburger-lg" }))), Do = ({
  printWithFootnote: e,
  setPrintWithFootnote: t,
  docViewContentId: n,
  printFrameRef: r
}) => /* @__PURE__ */ l.createElement(
  sr,
  {
    title: 'Print',
    iconName: "etds-print",
    isAccordion: !0,
    isLockFocus: !1
  },
  /* @__PURE__ */ l.createElement("div", { className: "form-check pb-1 d-flex align-items-center" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      type: "checkbox",
      id: "printWithFootnote",
      checked: e,
      onChange: () => t((a) => !a),
      onKeyDown: (a) => {
        a.key === "Enter" && (a.preventDefault(), t((i) => !i));
      },
      className: "custom-checkbox-input mr-2"
    }
  ), /* @__PURE__ */ l.createElement("label", { className: "form-check-label etds-check-box", htmlFor: "printWithFootnote" }, 'Print\x20with\x20Footer')),
  /* @__PURE__ */ l.createElement("div", { className: "text-right" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn btn-outline-primary-no-hover bg-white",
      onClick: () => F.etdsPrint(n, r)
    },
    'Print'
  ))
), ko = ({ children: e }) => /* @__PURE__ */ l.createElement(vl, null, /* @__PURE__ */ l.createElement("div", { className: "additional-actions-wrap" }, e)), Ji = ({ children: e, active: t = !0 }) => {
  const n = _e(null);
  return ye(() => {
    if (!t) return;
    const r = n.current, a = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ], i = () => Array.from(r.querySelectorAll(a.join(","))), s = i();
    s.length && !r.contains(document.activeElement) && s[0].focus();
    const c = (u) => {
      if (!t || u.key !== "Tab") return;
      const p = i();
      if (!p.length) return;
      const g = p[0], v = p[p.length - 1];
      u.shiftKey ? document.activeElement === g && (u.preventDefault(), v.focus()) : document.activeElement === v && (u.preventDefault(), g.focus());
    };
    return document.addEventListener("keydown", c), () => {
      document.removeEventListener("keydown", c);
    };
  }, [t]), /* @__PURE__ */ l.createElement("div", { ref: n }, e);
}, rc = () => /* @__PURE__ */ l.createElement(Ji, null, /* @__PURE__ */ l.createElement("div", { className: "footnote-section d-none", id: "footnoteSection" }, /* @__PURE__ */ l.createElement("div", { class: "footnote-actions" }, /* @__PURE__ */ l.createElement(
  "button",
  {
    className: "btn reset-btn-style close-footnote",
    onClick: (e) => F.handleCloseFootnoteClick(e),
    id: "footnoteSectionCloseButton"
  },
  /* @__PURE__ */ l.createElement("span", { className: "btn-text" }, 'Close\x20Footnotes'),
  /* @__PURE__ */ l.createElement(re, { symbol: "etds-close" })
)), /* @__PURE__ */ l.createElement("h6", { className: "footnote-heading" }, 'Footnotes'), /* @__PURE__ */ l.createElement("div", { className: "footnote-content", id: "footnoteContent" }))), PS = (e) => /* @__PURE__ */ l.createElement(Ff.DropdownIndicator, { ...e }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-down-arrow", className: `down-arrow-icon ${e.selectProps.menuIsOpen && "open"}` })), Sn = ({
  id: e = "react-select",
  name: t = "choose-year",
  options: n,
  value: r,
  handleChange: a,
  setIsOpen: i,
  placeholder: s = "",
  label: c = 'Select\x20Financial\x20Year',
  className: u = "",
  isDisabled: p = !1,
  isMandatory: g = !1,
  helperText: v = !1,
  helperTextLabelBottom: y,
  isCountryCode: E = !1,
  ...L
}) => {
  const x = _e("");
  ye(() => {
    !r && E && Array.isArray(n) && n.length === 1 && a(n[0]);
  }, [n, r, a]);
  const C = (D, { action: k }) => (x.current, x.current = D, D), T = (D, k) => k ? ((D == null ? void 0 : D.label) ?? (D == null ? void 0 : D.value) ?? "").toString().toLowerCase().includes(k.toLowerCase()) : !0;
  return /* @__PURE__ */ l.createElement("div", { className: `form-group-item ${u}` }, /* @__PURE__ */ l.createElement("label", { className: "control-label text-truncate", htmlFor: `${e}-${c.replace(/\s+/g, "-")}`, title: c }, c, " ", g && /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-label": 'Required' }, /* @__PURE__ */ l.createElement("span", { "aria-hidden": "true" }, "*"))), /* @__PURE__ */ l.createElement(
    QE,
    {
      name: t,
      inputId: `${e}-${c.replace(/\s+/g, "-")}`,
      classNamePrefix: "etds-select",
      className: "react-select-wrapper",
      placeholder: s,
      options: n,
      value: r,
      onInputChange: C,
      onChange: a,
      onMenuOpen: () => i(!0),
      onMenuClose: () => i(!1),
      isDisabled: p,
      tabSelectsValue: !1,
      styles: {
        option: (D, { isSelected: k, isFocused: N }) => ({
          ...D,
          backgroundColor: k ? "var(--secondary)" : N ? "var(--secondary-variant-3)" : "transparent",
          color: k ? "var(--primary-variant-6)" : "var(--primary-variant-7)"
        })
        //dropdownIndicator: (base, { selectProps }) => ({
        //...base,
        //transform: selectProps.menuIsOpen
        // ? 'rotate(180deg)'
        // : 'rotate(0deg)',
        //}),
      },
      filterOption: T,
      noOptionsMessage: F.customNoOptionsMessage,
      components: { DropdownIndicator: PS },
      menuPosition: "fixed",
      ...L
    }
  ), v && /* @__PURE__ */ l.createElement("span", { class: "custom-helper-text" }, y));
}, mD = ({
  selectedDateRange: e,
  handleDateChange: t,
  viewType: n,
  showDateRangeError: r,
  dateLimits: a,
  validMinDateLimits: i,
  validMaxDateLimits: s,
  label: c = 'Select\x20Date\x20Range',
  errorLabel: u = 'Please\x20choose\x20date\x20range\x20between',
  placeholder: p = 'Select\x20Date\x20Range'
}) => {
  const g = n === Pi;
  return /* @__PURE__ */ l.createElement(
    "div",
    {
      className: `form-group-item date-range ${g ? "disabled" : ""} ${r ? "error-wrapper" : ""}`
    },
    /* @__PURE__ */ l.createElement("label", { className: "control-label text-truncate", title: c }, c),
    /* @__PURE__ */ l.createElement(
      hm,
      {
        id: "date-range-picker",
        placeholder: p,
        onChange: t,
        dateFormat: "dd/MM/yyyy",
        range: !0,
        value: e,
        years: {
          start: a.min ? a.min.getFullYear() : 1997,
          end: a.max ? a.max.getFullYear() : 2050
        },
        min: a.min,
        max: a.max,
        disabled: g
      }
    ),
    r && /* @__PURE__ */ l.createElement("span", { "aria-live": "assertive", role: "alert", className: "custom-error" }, /* @__PURE__ */ l.createElement(re, { symbol: "info-circle" }), " ", u, " ", i, " - ", s)
  );
}, gD = ({
  headingLabel: e = 'No\x20Dues\x20Found',
  subHeadingLabel: t = 'Please\x20adjust\x20your\x20filters',
  classNames: n = -0
}) => /* @__PURE__ */ l.createElement("div", { class: `section-chapter-wrapper tax-calendar-content-section ${n}` }, /* @__PURE__ */ l.createElement("div", { class: "no-due-section" }, /* @__PURE__ */ l.createElement("span", { role: "heading", "aria-level": "3" }, e), /* @__PURE__ */ l.createElement("span", { role: "heading", "aria-level": "4" }, t))), Ap = ({
  article: e = "",
  kmsDefaultRedirection: t = "",
  kmsGroupId: n = "",
  plid: r = "",
  ccdgaDefaultRedirection: a = "",
  ccdgaPlid: i = "",
  kmsURL: s = "",
  ccdgaURL: c = ""
}) => {
  const u = () => {
    e.friendlyUrlPath !== "" && F.handleEmailAndRedirection({ article: e, kmsDefaultRedirection: t, kmsGroupId: n, plid: r, ccdgaDefaultRedirection: a, ccdgaPlid: i, emailRedirection: !0, kmsURL: s, ccdgaURL: c });
  };
  return /* @__PURE__ */ l.createElement("div", { class: "additional-action" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      class: "title-wrap open-false",
      onClick: () => u(),
      "aria-label": `${'Mail'}, ${'Graphic'}`,
      title: 'Mail'
    },
    /* @__PURE__ */ l.createElement("div", { class: "title text-truncate" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-mail" }), /* @__PURE__ */ l.createElement("span", { class: "title-text text-truncate" }, 'Mail'))
  ));
}, hD = ({ classNames: e = "", children: t, totalItems: n }) => /* @__PURE__ */ l.createElement("div", { className: "acts-wrapper" }, /* @__PURE__ */ l.createElement("ul", { className: `acts-list ${e}`, role: "list", "aria-label": "items" }, l.Children.map(
  t,
  (r, a) => l.cloneElement(r, {
    itemIndex: a + 1,
    totalItems: n
  })
))), vD = ({ url: e, label: t, underline: n = !1, itemIndex: r, totalItems: a }) => /* @__PURE__ */ l.createElement(
  "li",
  {
    className: "acts-item",
    role: "listitem",
    "aria-posinset": r,
    "aria-setsize": a
  },
  /* @__PURE__ */ l.createElement("a", { href: e, className: "act-title lfr-portal-tooltip", title: F.extractTextFromReactElement(t) }, /* @__PURE__ */ l.createElement("span", { class: `act-name ${n && "text-underline"}` }, t), /* @__PURE__ */ l.createElement(re, { symbol: "etds-open-in-new-tab" }))
), NS = ({
  label: e = 'Select',
  classNames: t = "",
  children: n
}) => /* @__PURE__ */ l.createElement("div", { className: `select-section-chapter ${t}` }, /* @__PURE__ */ l.createElement("span", { className: "title" }, e), /* @__PURE__ */ l.createElement("div", { className: "radio-wrap", role: "radiogroup", "aria-label": e }, n)), Is = ({
  label: e,
  value: t,
  isChecked: n = !1,
  handleChange: r
}) => /* @__PURE__ */ l.createElement("div", { className: "custom-control custom-radio custom-control-inline custom-control-outside m-0" }, /* @__PURE__ */ l.createElement("label", { htmlFor: e.replace(/\s+/g, "-") }, /* @__PURE__ */ l.createElement(
  "input",
  {
    type: "radio",
    className: "custom-control-input",
    role: "radio",
    value: t,
    checked: n,
    onChange: r,
    id: e.replace(/\s+/g, "-"),
    "aria-label": e
  }
), /* @__PURE__ */ l.createElement("span", { className: "custom-control-label ml-1" }, /* @__PURE__ */ l.createElement("span", { className: "custom-control-label-text", "aria-hidden": "true" }, e)))), yD = ({ isAutofit: e = !1 }) => /* @__PURE__ */ l.createElement("div", { className: `form-group-item${e ? "-autofit" : ""}` }), bD = ({ activeTab: e, setActiveTab: t, expandedSearchOptions: n, setExpandedSearchOptions: r, SEARCH: a, COMPARE: i, disableDropdown: s = !0 }) => {
  const c = _e(null), u = _e(null), p = (g, v) => {
    var y, E;
    g.key === "ArrowLeft" && (g.preventDefault(), v === i && ((y = c.current) == null || y.focus())), g.key === "ArrowRight" && (g.preventDefault(), v === a && ((E = u.current) == null || E.focus()));
  };
  return /* @__PURE__ */ l.createElement("ul", { className: `tab-style  ${n ? "" : "border-bottom-0"}`, role: "tablist", "aria-label": 'etds-search-compare-tablist' }, n ? /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(
    "li",
    {
      className: `${e == a ? "active" : ""}`,
      role: "presentation"
    },
    /* @__PURE__ */ l.createElement(
      "button",
      {
        id: "tab-search",
        role: "tab",
        "aria-selected": e == a,
        "aria-controls": "panel-search",
        tabIndex: e == a ? 0 : -1,
        onClick: () => t(a),
        onKeyDown: (g) => p(g, a),
        ref: c
      },
      'Search'
    )
  ), /* @__PURE__ */ l.createElement(
    "li",
    {
      className: `${e == i ? "active" : ""}`,
      role: "presentation"
    },
    /* @__PURE__ */ l.createElement(
      "button",
      {
        id: "tab-compare",
        role: "tab",
        "aria-selected": e == i,
        "aria-controls": "panel-compare",
        tabIndex: e == i ? 0 : -1,
        onClick: () => t(i),
        onKeyDown: (g) => p(g, i),
        ref: u
      },
      'Compare'
    )
  )) : /* @__PURE__ */ l.createElement("p", { className: "search-compare-text mb-0" }, 'etds-search-and-compare'), s && /* @__PURE__ */ l.createElement("button", { onClick: () => r(!n), className: "btn-dropdown", "aria-expanded": n, "aria-label": 'Toggle\x20Search\x20\x26amp\x3b\x20Compare\x20Options' }, /* @__PURE__ */ l.createElement(
    re,
    {
      symbol: "etds-down-arrow",
      className: `transition ${n ? "rotate-180" : ""}`
    }
  )));
}, wD = (e) => {
  e.slickNext(), F.announceScreenReaderMessage('Slide\x20changed');
}, xD = (e) => {
  e.slickPrev(), F.announceScreenReaderMessage('Slide\x20changed');
}, ED = (e, t) => {
  e.slickGoTo(t), F.announceScreenReaderMessage('Slide\x20changed');
}, LD = (e, t, n) => {
  t ? e.slickPause() : e.slickPlay(), n(!t);
}, CD = ({
  id: e = "email-input",
  emailValue: t = "",
  onEmailChange: n = () => {
  },
  className: r = "",
  onValidationChange: a = () => {
  },
  placeholder: i = 'etds-enter-your-email',
  label: s = 'Email\x20Address',
  name: c = "email",
  isMandatory: u = !1,
  errorMessage: p = 'Invalid\x20Email',
  showSearchIcon: g = !1,
  helperText: v = !1,
  helperTextLabelBottom: y,
  showVerifyEmail: E = !1,
  emailVerified: L = !1,
  children: x,
  errorOnVerify: C = "",
  ...T
}) => {
  const [D, k] = V(""), N = (R) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(R);
  return ye(() => {
    C && (console.log("errorOnVerify :", C), k(C));
  }, [C]), ye(() => {
    if (u && t === "")
      a(!1);
    else if (t) {
      const R = N(t);
      k(R ? "" : p), a(!!R);
    } else
      k(""), a(!0);
  }, [t]), /* @__PURE__ */ l.createElement("div", { className: `form-group-item email-input-group ${D ? "error-wrapper" : ""}` }, E ? /* @__PURE__ */ l.createElement("div", { className: "input-with-verify-email" }, /* @__PURE__ */ l.createElement("label", { className: "control-label text-truncate d-flex", htmlFor: e, title: s }, s, " ", u && /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-hidden": "true" }, "*")), x) : /* @__PURE__ */ l.createElement("label", { className: "control-label text-truncate d-flex", htmlFor: e, title: s }, s, " ", u && /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-hidden": "true" }, "*")), L ? /* @__PURE__ */ l.createElement("div", { class: "email-input-wrapper" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      id: e,
      name: c,
      placeholder: i,
      type: "email",
      value: t,
      onChange: n,
      "aria-invalid": !!D,
      "aria-describedby": D ? `${e}-error` : `${e}-helper`,
      "aria-required": !!u,
      className: "form-control",
      ...T
    }
  ), /* @__PURE__ */ l.createElement("span", { id: "emailStatus", class: "email-status-icon" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-verified-check" }))) : /* @__PURE__ */ l.createElement(
    "input",
    {
      id: e,
      name: c,
      placeholder: i,
      type: "email",
      value: t,
      "aria-invalid": !!D,
      "aria-describedby": D ? `${e}-error` : `${e}-helper`,
      "aria-required": !!u,
      onChange: n,
      className: "form-control",
      ...T
    }
  ), D ? /* @__PURE__ */ l.createElement("span", { id: `${e}-error`, className: "custom-error", "aria-label": `alert ${D}` }, " ", /* @__PURE__ */ l.createElement(re, { symbol: "info-circle", "aria-label": 'error\x20icon' }), " ", D) : v && /* @__PURE__ */ l.createElement("span", { id: `${e}-helper`, className: "custom-helper-text", "aria-label": `info ${'Enter\x20Your\x20Email\x20ID'}` }, 'Enter\x20Your\x20Email\x20ID'));
}, SD = ({
  id: e = "mobile-with-country-code",
  invalidMobileError: t = 'Please\x20enter\x20a\x20valid\x2010\x20digit\x20mobile\x20number',
  invalidCountryCodeError: n = 'Please\x20select\x20a\x20country\x20code',
  countryCodeValue: r,
  onCountryCodeChange: a,
  mobileValue: i,
  onMobileChange: s,
  picklistERC: c = "COUNTRY_CODE",
  label: u = 'etds-mobile-number',
  mobilePlaceholder: p = 'etds-enter-mobile-number',
  isCountryCodeEnable: g,
  onValidationChange: v = () => {
  }
}) => {
  const [y, E] = V([]), [L, x] = V(""), [C, T] = V(!0), [D, k] = V(!1), N = (R) => /^[0-9]{10}$/.test(R);
  return ye(() => {
    (async () => {
      try {
        const f = (await F.fetchAllPickList(c, "asc", !1)).map((_) => ({
          value: _.id,
          label: `+${_.id} - ${_.name}`
        }));
        E(f);
      } catch (A) {
        console.error("Error fetching country codes:", A);
      } finally {
        T(!1);
      }
    })();
  }, [c]), ye(() => {
    const R = i ? N(i) : !0;
    i ? R ? !!r ? (x(""), v(!0)) : (x(n), v(!1)) : (x(t), v(!1)) : (x(""), v(!0));
  }, [i, r]), /* @__PURE__ */ l.createElement("div", { className: "form-group-item form-group-autofit phone-input-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      id: e,
      options: y,
      handleChange: a,
      value: r,
      setIsOpen: k,
      label: 'Country',
      placeholder: "+91",
      className: "phone-country-code",
      helperText: !0,
      helperTextLabelBottom: 'Country\x20Code',
      isCountryCode: !0
    }
  ), /* @__PURE__ */ l.createElement("div", { className: `form-group-item ${L ? "error-wrapper" : ""}` }, /* @__PURE__ */ l.createElement("label", { className: "control-label text-truncate d-flex", htmlFor: e, title: 'Mobile' }, 'Mobile'), /* @__PURE__ */ l.createElement(
    "input",
    {
      id: e,
      name: "mobile",
      placeholder: p,
      type: "tel",
      onChange: (R) => {
        const A = R.target.value.replace(/\D/g, "");
        s({
          ...R,
          target: {
            ...R.target,
            value: A
          }
        });
      },
      value: i,
      className: "form-control",
      "aria-invalid": !!L,
      "aria-describedby": L ? `${e}-error` : `${e}-helper`
    }
  ), L ? /* @__PURE__ */ l.createElement("span", { id: `${e}-error`, className: "custom-error", "aria-label": `alert ${L}` }, " ", /* @__PURE__ */ l.createElement(re, { symbol: "info-circle" }), " ", L) : /* @__PURE__ */ l.createElement("span", { id: `${e}-helper`, className: "custom-helper-text", "aria-label": `info ${'Enter\x20Your\x20Mobile\x20Number'}` }, 'Enter\x20Your\x20Mobile\x20Number')));
}, TD = ({
  id: e = "agree",
  friendlyUrlPath: t,
  onAgreementChange: n,
  onVersionNumberChange: r,
  isAgreed: a = !1
}) => {
  const [i, s] = V(a), [c, u] = V(!1), [p, g] = V(""), [v, y] = V(""), E = _e(null);
  ye(() => {
    t && (async () => {
      var T, D, k;
      try {
        const N = await Ve.getStructuredContentByFriendlyUrl(t);
        if (console.log("response from terms and condition is ", N), ((T = N == null ? void 0 : N.items) == null ? void 0 : T.length) > 0) {
          const R = N.items[0], A = F.getValuesFromJson(R, "content").data, f = R == null ? void 0 : R.id, _ = await Ve.getStructuredContentVersions(f), O = (k = (D = _ == null ? void 0 : _.items[0]) == null ? void 0 : D.version) == null ? void 0 : k.number;
          typeof r == "function" && r({ versionNumber: O }), y(R == null ? void 0 : R.title), g(A);
        } else
          g(`<p>${'No\x20terms\x20and\x20condition\x20found'}</p>`);
      } catch (N) {
        console.error("Failed to fetch terms:", N), g(`<p>${'No\x20terms\x20and\x20condition\x20found'}</p>`);
      }
    })();
  }, [t]);
  const L = (C) => {
    const T = C.target.checked;
    s(T), n == null || n(T);
  }, x = () => {
    u((C) => !C);
  };
  return /* @__PURE__ */ l.createElement("div", { className: "tax-evasion-terms-conditions" }, /* @__PURE__ */ l.createElement("div", { className: "form-check" }, /* @__PURE__ */ l.createElement("div", { className: "form-check-label" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      type: "checkbox",
      id: e,
      checked: i,
      onChange: L,
      className: "form-check-input custom-checkbox-input"
    }
  ), /* @__PURE__ */ l.createElement("label", { htmlFor: e, className: "sub-heading-2-regular" }, 'I\x20agree\x20to\x20share\x20my\x20details\x20with\x20the\x20Income-tax\x20Department\x20as\x20per\x20the\x20Terms\x20and\x20Conditions\x20detailed\x20in\x20the\x20link\x20below\x2e'))), /* @__PURE__ */ l.createElement(
    "button",
    {
      type: "button",
      onClick: x,
      ref: E,
      className: `btn view-terms-link ${c ? "active" : ""}`,
      role: "link",
      "aria-expanded": c
    },
    'View\x20Terms\x20and\x20Conditions',
    " ",
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-right-arrow-sm" })
  ), c && /* @__PURE__ */ l.createElement("div", { className: "page-notification page-notification-font-12 page-note" }, /* @__PURE__ */ l.createElement("div", { className: "page-notification-title" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-info", "aria-label": 'Information' }), " ", /* @__PURE__ */ l.createElement("strong", null, v)), /* @__PURE__ */ l.createElement("div", { className: "page-notification-content ml-0" }, /* @__PURE__ */ l.createElement("div", { dangerouslySetInnerHTML: { __html: p } }), /* @__PURE__ */ l.createElement("div", { className: "text-right" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      role: "link",
      type: "button",
      onClick: () => {
        var C;
        u(!1), (C = E.current) == null || C.focus();
      },
      className: "btn element-a read-less-conditions p-0"
    },
    'Read\x20Less',
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-up-arrow-sm" })
  )))));
}, Xu = ({
  label: e,
  placeholder: t = "* * * * * *",
  value: n,
  onChange: r,
  error: a = "",
  type: i = "password",
  name: s,
  required: c = !1,
  successMessage: u = "",
  disabled: p = !1,
  otpHide: g = !0,
  errorIcon: v = !1,
  ariaLabel: y = "",
  ...E
}) => {
  const [L, x] = V(g), C = (T) => {
    const D = T.target.value.replace(/\D/g, "");
    r && r({
      ...T,
      target: {
        ...T.target,
        value: D
      }
    });
  };
  return /* @__PURE__ */ l.createElement("div", { className: `otp-input-wrapper form-group-item ${a ? "error-wrapper" : ""}` }, e && /* @__PURE__ */ l.createElement("label", { htmlFor: s, className: "control-label text-truncate d-flex", title: e }, e, " ", c && /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-hidden": "true" }, " *")), /* @__PURE__ */ l.createElement("div", { className: "otp-input-field" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      id: s,
      type: L ? i : "text",
      placeholder: t,
      value: n,
      inputMode: "numeric",
      pattern: "[0-9]*",
      onChange: C,
      className: "form-control with-right-icon",
      disabled: p,
      "aria-invalid": !!a,
      "aria-describedby": a && `${s}-error`,
      "aria-label": y,
      "aria-required": !!c,
      ...E
    }
  ), /* @__PURE__ */ l.createElement(
    "button",
    {
      type: "button",
      onClick: () => x(!L),
      className: "otp-toggle-btn form-control-icon",
      "aria-label": L ? "Show OTP" : "Hide OTP",
      disabled: p
    },
    /* @__PURE__ */ l.createElement(l.Fragment, null, L ? (
      // Eye Off Icon
      /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(re, { symbol: "etds-visibility-off" }))
    ) : (
      // Eye Icon
      /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(re, { symbol: "etds-visibility-on" }))
    ))
  )), a ? /* @__PURE__ */ l.createElement("span", { id: `${s}-error`, "aria-live": "assertive", role: "alert", className: "custom-error" }, v && /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("span", { className: "mr-1" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-error-filled", "aria-label": 'error\x20icon' }))), a) : (u == null ? void 0 : u.trim()) && /* @__PURE__ */ l.createElement("span", { className: "custom-success", "aria-live": "polite", role: "status" }, /* @__PURE__ */ l.createElement(re, { symbol: "check-circle-full", className: "mr-1" }), u));
}, RS = ({
  messageKey: e = 'etds-alert-success-message',
  iconSymbol: t = "etds-check-circle-x18",
  type: n = "success"
}) => {
  const r = (a) => {
    switch (a) {
      case "info":
        return "alert-info";
      case "success":
      default:
        return "alert-success";
    }
  };
  return /* @__PURE__ */ l.createElement("div", { className: `etds-alert-box m-0 ${r(n)}` }, /* @__PURE__ */ l.createElement(re, { symbol: t, "aria-label": n }), /* @__PURE__ */ l.createElement("span", null, e));
}, IS = ({
  titleKey: e = 'etds-card-title',
  children: t,
  cardBodyClassNames: n = "",
  cardClassName: r = ""
}) => /* @__PURE__ */ l.createElement("div", { className: `etds-card ${r}` }, e && /* @__PURE__ */ l.createElement("div", { className: "etds-card-heading" }, /* @__PURE__ */ l.createElement("h2", { className: "text-primary m-0 h5" }, e)), /* @__PURE__ */ l.createElement("div", { className: `etds-card-body ${n}` }, t)), DD = ({
  titleKey: e = 'etds-success-message-title',
  messageKey: t = 'etds-success-message-paragraph',
  homeURL: n,
  newsLetterSubscribe: r = !1,
  classNames: a = "",
  iconSymbol: i = "",
  type: s = "",
  buttonLabel: c = 'Return\x20To\x20Home',
  cardBodyClassNames: u = ""
}) => /* @__PURE__ */ l.createElement(IS, { titleKey: e, classNames: "etds-card-border-with-margin", cardClassName: a, cardBodyClassNames: u }, /* @__PURE__ */ l.createElement(RS, { messageKey: t, iconSymbol: i, type: s }), /* @__PURE__ */ l.createElement(DS, { newsLetterSubscribe: r }, /* @__PURE__ */ l.createElement(
  TS,
  {
    label: c,
    buttonType: "primary",
    onClick: () => window.location.href = n,
    className: "btn btn-primary"
  }
))), kD = ({
  titleKey: e = 'I\x20am\x20interested\x20in\x20receiving\x20updates\x20for\x3b',
  selectedOptions: t,
  setSelectedOptions: n,
  subscriptionChoices: r
}) => {
  const a = (i, s) => {
    n((c) => ({
      ...c,
      [i]: s
    }));
  };
  return /* @__PURE__ */ l.createElement("div", { className: "etds-checkbox-selection-section" }, /* @__PURE__ */ l.createElement("span", { className: "checkbox-label" }, e), /* @__PURE__ */ l.createElement("div", { className: "etds-checkbox-content" }, r.map((i) => /* @__PURE__ */ l.createElement("div", { className: "option", key: i.id }, /* @__PURE__ */ l.createElement(
    "input",
    {
      type: "checkbox",
      id: i.id,
      checked: t[i.id] || !1,
      onChange: (s) => a(i.id, s.target.checked),
      className: "form-check-input custom-checkbox-input"
    }
  ), /* @__PURE__ */ l.createElement("label", { htmlFor: i.id, className: "form-check-label", title: i.name }, i.name)))));
}, PD = ({ title: e = "", placeholder: t = "", maxChars: n = 1e3, setText: r, text: a }) => {
  const i = (s) => {
    s.target.value.length <= n && r(s.target.value);
  };
  return /* @__PURE__ */ l.createElement("div", { className: "etds-textarea-wrapper" }, /* @__PURE__ */ l.createElement("div", { "aria-live": "assertive", className: "sr-only" }, 'Message\x20Field\x20Enabled'), e && /* @__PURE__ */ l.createElement("label", { className: "mb-2", htmlFor: e.replace(/\s+/g, "-"), title: e }, e), /* @__PURE__ */ l.createElement("div", { className: "etds-textarea-with-count" }, /* @__PURE__ */ l.createElement(
    "textarea",
    {
      id: e.replace(/\s+/g, "-"),
      placeholder: t,
      value: a,
      onChange: i,
      "aria-describedby": "charcount"
    }
  ), /* @__PURE__ */ l.createElement("div", { className: "etds-char-count", id: "charcount" }, a.length, "/", n, " ", 'Character')));
}, ND = ({ title: e = "", className: t = "", handleClick: n, iconSymbol: r = "etds-external-link-x15" }) => /* @__PURE__ */ l.createElement("div", { className: `etds-title-with-redirection-link ${t}` }, /* @__PURE__ */ l.createElement("div", { className: "etds-redirection-link", ...n && { onClick: n } }, /* @__PURE__ */ l.createElement("span", { className: "cursor-pointer" }, e), "  ", /* @__PURE__ */ l.createElement(re, { symbol: r }))), RD = ({
  placeholder: e = 'Message',
  label: t = 'Message',
  name: n = "message",
  value: r = "",
  handleChange: a,
  isMandatory: i = !1,
  minLength: s,
  maxLength: c,
  messageLength: u = 0,
  errorMessage: p = "",
  showSearchIcon: g = !1,
  rows: v = 5,
  cols: y = 60,
  onValidationChange: E = () => {
  },
  helperText: L = 'Entry\x20Your\x20Message',
  ...x
}) => {
  const [C, T] = V(""), D = () => r.length > c || r.length < s && r !== "";
  return ye(() => {
    if (i && r === "")
      E(!1);
    else if (r) {
      const k = !(r.length < s || r.length > c);
      T(k ? "" : p), E(!!k);
    } else
      T(""), E(!0);
  }, [r]), /* @__PURE__ */ l.createElement(
    "div",
    {
      className: `etds-textarea-wrapper form-group-item ${D() > 0 ? "error-wrapper" : ""}`
    },
    /* @__PURE__ */ l.createElement("label", { htmlFor: n, className: "control-label text-truncate d-flex", title: t }, t, " ", i && /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-hidden": "true" }, " *")),
    /* @__PURE__ */ l.createElement("div", { className: "etds-textarea-with-count mw-100" }, /* @__PURE__ */ l.createElement(
      "textarea",
      {
        id: n,
        name: n,
        className: "form-control with-right-icon m-0",
        value: r,
        placeholder: e,
        rows: v,
        cols: y,
        onChange: a,
        ...c ? { maxLength: c } : {},
        ...s ? { minLength: s } : {},
        "aria-invalid": !!C,
        "aria-describedby": `${n}-helper-text ${n}-error`,
        "aria-labelledby": n,
        "aria-required": !!i,
        ...x
      }
    ), C && D() > 0 ? /* @__PURE__ */ l.createElement("span", { id: `${n}-error`, "aria-live": "assertive", role: "alert", className: "custom-error" }, /* @__PURE__ */ l.createElement(re, { symbol: "info-circle", "aria-label": 'error\x20icon' }), C) : L && /* @__PURE__ */ l.createElement("span", { id: `${n}-helper-text`, className: "custom-helper-text" }, L), /* @__PURE__ */ l.createElement("div", { className: "etds-char-count" }, r.length, "/", c, " ", 'Character'))
  );
};
function ID({
  maxFiles: e = 0,
  maxFileSizeMb: t = 0,
  label: n = 'etds-upload-files',
  helperText: r,
  isResetFiles: a,
  acceptedFilesDropZone: i,
  acceptedFilesInput: s,
  handleResetFiles: c = () => {
  },
  isMultiple: u = !1,
  handleFiles: p = () => {
  }
}) {
  const [g, v] = V([]), [y, E] = V(""), L = _e(null), x = t * 1024 * 1024, C = (_) => {
    const O = Object.keys(i || {});
    return O.length === 0 || O.some((ee) => _.type === ee) ? x > 0 && _.size > x ? `${'Invalid\x20file\x20type\x2fsize'}` : null : `${'Invalid\x20file\x20type\x2fsize'}`;
  }, T = vt(
    (_) => {
      E("");
      const O = [...g, ..._];
      if (e > 0 && O.length > e) {
        E(
          `${'Exceeds\x20maximum\x20file\x20count\x20of'} ${e}`
        );
        return;
      }
      for (const ge of _) {
        const ie = C(ge);
        if (ie) {
          E(ie);
          return;
        }
      }
      const J = _.filter((ge) => !C(ge)), ee = [...g, ...J];
      v(ee), p(ee), L.current && (L.current.value = null);
    },
    [g, e, C, p]
  ), { getRootProps: D, isDragActive: k } = ef({
    onDrop: T,
    multiple: u
  }), N = (_) => {
    E("");
    const O = Array.from(_.target.files);
    if (e > 0 && g.length + O.length > e) {
      E(
        `${'Exceeds\x20maximum\x20file\x20count\x20of'} ${e}`
      );
      return;
    }
    for (const ee of O) {
      const ge = C(ee);
      if (ge) {
        E(ge);
        return;
      }
    }
    const J = e === 0 ? [...g, ...O] : [...g, ...O].slice(0, e);
    v(J), O.length > 0 && O.forEach((ee) => {
      F.announceScreenReaderMessage(
        `${ee.name} ${'uploaded\x20successfully'}`
      );
    }), p(J);
  }, R = (_) => {
    const O = g.filter((J, ee) => ee !== _);
    v(O), p(O), L.current && (L.current.value = null), F.announceScreenReaderMessage('deleted\x20successfully'), E("");
  }, A = (_) => {
    _.preventDefault(), E(""), L.current.click();
  }, f = () => {
    a && (v([]), c(!1), E(""), L.current && (L.current.value = null));
  };
  return ye(() => {
    f();
  }, [a]), /* @__PURE__ */ l.createElement("div", { className: "etds-file-upload" }, /* @__PURE__ */ l.createElement("label", { htmlFor: "fileUpload", className: "form-label", title: n }, n), /* @__PURE__ */ l.createElement(
    "div",
    {
      ...D(),
      className: `etds-file-upload-container ${k ? "bg-light" : ""}`,
      style: { cursor: "pointer" },
      "aria-label": 'Upload\x20file'
    },
    /* @__PURE__ */ l.createElement(
      "input",
      {
        type: "file",
        ref: L,
        id: "fileUpload",
        className: "form-control",
        ...u && { multiple: !0 },
        onChange: N,
        accept: s,
        style: { display: "none" }
      }
    ),
    /* @__PURE__ */ l.createElement("label", { className: "m-0", title: 'Drag\x20\x26amp\x3b\x20Drop\x20or' }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-file-upload" }), 'Drag\x20\x26amp\x3b\x20Drop\x20or' + " ", /* @__PURE__ */ l.createElement("span", { onClick: A, tabIndex: 0, "aria-label": `${'Browse\x20File'}`, role: "link" }, 'Browse\x20File'))
  ), /* @__PURE__ */ l.createElement("div", { className: "fileSize" }, y ? /* @__PURE__ */ l.createElement("span", { "aria-live": "assertive", role: "alert", className: "custom-error required-error" }, /* @__PURE__ */ l.createElement(re, { symbol: "info-circle", "aria-label": 'error\x20icon' }), y) : r && /* @__PURE__ */ l.createElement("span", { className: "custom-helper-text" }, r), x > 0 && /* @__PURE__ */ l.createElement("span", { className: "custom-helper-text" }, 'Max\x2e\x20File\x20Size\x3a', " ", t, "MB")), g.length > 0 && /* @__PURE__ */ l.createElement("div", { className: "fileDetailsList" }, g.map((_, O) => /* @__PURE__ */ l.createElement("div", { key: O, className: "fileDetails" }, /* @__PURE__ */ l.createElement("div", { className: "fileName" }, /* @__PURE__ */ l.createElement("div", { className: "icon" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-document", "aria-label": `${'file\x20icon'}` })), /* @__PURE__ */ l.createElement("span", null, _.name, " (", _.size < 1024 * 1024 ? `${(_.size / 1024).toFixed(2)} KB` : `${(_.size / 1024 / 1024).toFixed(2)} MB`, ")")), /* @__PURE__ */ l.createElement("div", { className: "fileActions" }, /* @__PURE__ */ l.createElement(
    "a",
    {
      href: URL.createObjectURL(_),
      download: _.name,
      className: "btn btn-unstyled fileDownload",
      "aria-label": `${_.name} ${'Download\x20PDF'}`,
      role: "button"
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-download-1" })
  ), /* @__PURE__ */ l.createElement(
    "button",
    {
      type: "button",
      className: "btn btn-unstyled fileRemove",
      onClick: () => R(O),
      "aria-label": `${_.name} ${'delete'}`
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-delete" })
  ))))));
}
const AD = ({
  type: e = "success",
  title: t = void 0,
  message: n = 'etds-your-request-submitted-successfully',
  isDismissible: r = void 0,
  handleOnClose: a = () => {
  },
  className: i = "",
  symbol: s = "",
  srAnnouncementMessage: c = 'Notification\x20closed'
}) => {
  const [u, p] = l.useState(!0), [g, v] = l.useState(""), y = () => {
    a(), p(!1), setTimeout(() => {
      v(c);
    }, 50);
  };
  return /* @__PURE__ */ l.createElement(l.Fragment, null, u && /* @__PURE__ */ l.createElement(
    vm,
    {
      displayType: e,
      title: t,
      onClose: r ? y : void 0,
      className: i,
      ...s ? { symbol: s } : {},
      role: "presentation",
      "aria-live": "off",
      "aria-hidden": "true"
    },
    n
  ), /* @__PURE__ */ l.createElement(
    "div",
    {
      "aria-live": "assertive",
      role: "status",
      className: "sr-only",
      style: { position: "absolute" }
    },
    g
  ));
}, OD = ({
  password: e = "",
  confirmPassword: t = "",
  handleChange: n,
  heading: r = 'Set\x20Password',
  alignmentType: a = "horizontal",
  fieldOneName: i = "password",
  fieldSecondName: s = "confirmPassword",
  onValidationChange: c,
  passwordSpecialCharacters: u = `(~!@#$%^&* ( ) _ - + = [ ] { } : ; " ' < > , . ? /.)`
}) => {
  const [p, g] = V(!1), [v, y] = V(!1), E = (D) => {
    const k = D.length, N = /[A-Z]/.test(D), R = /[a-z]/.test(D), A = /\d/.test(D), f = /[^A-Za-z0-9]/.test(D), _ = {};
    let O = 0, J = !1;
    for (const ee of D)
      _[ee] = (_[ee] || 0) + 1;
    for (const ee of Object.values(_))
      if (ee === 2)
        O++;
      else if (ee > 2) {
        J = !0;
        break;
      }
    return k >= 8 && k <= 15 && N && R && A && f && Object.values(_).every((ee) => ee === 1) ? {
      score: 3,
      label: 'High',
      color: "#1A7844"
    } : k === 8 && O === 1 && !J ? {
      score: 2,
      label: 'Medium',
      color: "#FFAA01"
    } : {
      score: 1,
      label: 'Low',
      color: "#D1604E"
    };
  }, { score: L, label: x } = E(e), C = {
    length: e.length >= 8 && e.length <= 15,
    uppercase: /[A-Z]/.test(e),
    number: /\d/.test(e),
    special: /[^A-Za-z0-9]/.test(e)
  }, T = Object.values(C).every((D) => D === !0);
  return ye(() => {
    c && c(T);
  }, [e, t, T, c]), /* @__PURE__ */ l.createElement("div", { className: `password-section-wrapper otp-input-wrapper form-group-autofit m-0 ${a === "vertical" && "etds-set-password-vertical"}` }, /* @__PURE__ */ l.createElement("div", { className: "password-setup-container" }, /* @__PURE__ */ l.createElement("div", { className: "password-form" }, r != "" && /* @__PURE__ */ l.createElement("h2", { className: "mb-4 text-primary h4" }, r), /* @__PURE__ */ l.createElement("div", { className: "form-group-item" }, /* @__PURE__ */ l.createElement("label", { className: "control-label text-truncate d-flex", for: "otp-input", title: 'Enter\x20New\x20Password' }, 'Enter\x20New\x20Password', " ", /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-hidden": "true" }, " *")), /* @__PURE__ */ l.createElement("div", { className: "otp-input-field" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      id: "otp-input",
      type: p ? "text" : "password",
      name: i,
      value: e,
      onChange: n,
      placeholder: "********",
      required: !0,
      className: "form-control with-right-icon",
      autocomplete: "off",
      "aria-required": "true"
    }
  ), /* @__PURE__ */ l.createElement(
    "button",
    {
      type: "button",
      onClick: () => g((D) => !D),
      className: "otp-toggle-btn form-control-icon",
      "aria-label": p ? 'hide\x20otp' : 'show\x20otp'
    },
    p ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-visibility-on" }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-visibility-off" })
  )), e && /* @__PURE__ */ l.createElement("div", { className: "strength-meter" }, /* @__PURE__ */ l.createElement("span", null, 'Password\x20Strength\x20\x3a', " ", x), /* @__PURE__ */ l.createElement("div", { className: "multi-strength-bar" }, /* @__PURE__ */ l.createElement("div", { className: `segment ${L >= 1 ? "red" : ""}` }), /* @__PURE__ */ l.createElement("div", { className: `segment ${L >= 2 ? "orange" : ""}` }), /* @__PURE__ */ l.createElement("div", { className: `segment ${L === 3 ? "green" : ""}` })))), a === "vertical" && /* @__PURE__ */ l.createElement("div", { className: "password-info" }, /* @__PURE__ */ l.createElement("div", { className: "info-box" }, /* @__PURE__ */ l.createElement("div", { className: "info-header" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-info-x20", "aria-label": 'Information\x20icon' }), /* @__PURE__ */ l.createElement("span", null, 'Please\x20ensure\x20the\x20following\x20criteria\x20are\x20met\x20while\x20setting\x20your\x20password')), /* @__PURE__ */ l.createElement("ul", { role: "list" }, /* @__PURE__ */ l.createElement("li", { role: "listitem", className: C.length ? "success" : "" }, C.length ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-check-icon", "aria-label": 'green\x20tick\x20icon' }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-round", "aria-label": 'red\x20cross\x20icon' }), 'Use\x208\x20to\x2015\x20characters', /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, `1 ${'of'} 4 `, C.length ? 'Satisfied' : 'Not\x20satisfied')), /* @__PURE__ */ l.createElement("li", { role: "listitem", className: C.uppercase ? "success" : "" }, C.uppercase ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-check-icon", "aria-label": 'green\x20tick\x20icon' }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-round", "aria-label": 'red\x20cross\x20icon' }), 'Use\x20at\x20least\x20one\x20uppercase\x20letter\x20\x28A-Z\x29', /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, `2 ${'of'} 4 `, C.uppercase ? 'Satisfied' : 'Not\x20satisfied')), /* @__PURE__ */ l.createElement("li", { role: "listitem", className: C.number ? "success" : "" }, C.number ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-check-icon", "aria-label": 'green\x20tick\x20icon' }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-round", "aria-label": 'red\x20cross\x20icon' }), 'Use\x20at\x20least\x20one\x20number\x20\x28e\x2eg\x2e\x20123\x29', /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, `3 ${'of'} 4 `, C.number ? 'Satisfied' : 'Not\x20satisfied')), /* @__PURE__ */ l.createElement("li", { role: "listitem", className: C.special ? "success" : "" }, C.special ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-check-icon", "aria-label": 'green\x20tick\x20icon' }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-round", "aria-label": 'red\x20cross\x20icon' }), 'Use\x20at\x20least\x20one\x20special\x20character', " ", u, /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, `4 ${'of'} 4 `, C.special ? 'Satisfied' : 'Not\x20satisfied'))))), /* @__PURE__ */ l.createElement("div", { className: "form-group-item" }, /* @__PURE__ */ l.createElement("label", { className: "control-label text-truncate d-flex", for: "reEnter-input", title: 'Re-Enter\x20New\x20Password' }, 'Re-Enter\x20New\x20Password', " ", /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-hidden": "true" }, " *")), /* @__PURE__ */ l.createElement("div", { className: "otp-input-field" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      id: "reEnter-input",
      type: v ? "text" : "password",
      name: s,
      value: t,
      onChange: n,
      placeholder: "********",
      required: !0,
      className: `form-control with-right-icon ${t && e !== t ? "error" : ""}`,
      autocomplete: "off",
      "aria-required": "true"
    }
  ), /* @__PURE__ */ l.createElement(
    "button",
    {
      type: "button",
      className: "otp-toggle-btn form-control-icon",
      onClick: () => y((D) => !D),
      "aria-label": v ? 'hide\x20otp' : 'show\x20otp'
    },
    v ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-visibility-on" }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-visibility-off" })
  )), t && e !== t && /* @__PURE__ */ l.createElement("span", { "aria-live": "assertive", role: "alert", className: "custom-error" }, /* @__PURE__ */ l.createElement(re, { symbol: "info-circle", "aria-label": 'error\x20icon' }), " ", 'Please\x20enter\x20the\x20same\x20password\x20as\x20above\x2e'))), a === "horizontal" && /* @__PURE__ */ l.createElement("div", { className: "password-info" }, /* @__PURE__ */ l.createElement("div", { className: "info-box" }, /* @__PURE__ */ l.createElement("div", { className: "info-header" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-info-x20", "aria-label": 'Information\x20icon' }), /* @__PURE__ */ l.createElement("span", null, 'Please\x20ensure\x20the\x20following\x20criteria\x20are\x20met\x20while\x20setting\x20your\x20password')), /* @__PURE__ */ l.createElement("ul", { role: "list" }, /* @__PURE__ */ l.createElement("li", { role: "listitem", className: C.length ? "success" : "" }, C.length ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-check-icon", "aria-label": 'green\x20tick\x20icon' }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-round", "aria-label": 'red\x20cross\x20icon' }), 'Use\x208\x20to\x2015\x20characters', /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, `1 ${'of'} 4 `, C.length ? 'Satisfied' : 'Not\x20satisfied')), /* @__PURE__ */ l.createElement("li", { role: "listitem", className: C.uppercase ? "success" : "" }, C.uppercase ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-check-icon", "aria-label": 'green\x20tick\x20icon' }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-round", "aria-label": 'red\x20cross\x20icon' }), 'Use\x20at\x20least\x20one\x20uppercase\x20letter\x20\x28A-Z\x29', /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, `2 ${'of'} 4 `, C.uppercase ? 'Satisfied' : 'Not\x20satisfied')), /* @__PURE__ */ l.createElement("li", { role: "listitem", className: C.number ? "success" : "" }, C.number ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-check-icon", "aria-label": 'green\x20tick\x20icon' }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-round", "aria-label": 'red\x20cross\x20icon' }), 'Use\x20at\x20least\x20one\x20number\x20\x28e\x2eg\x2e\x20123\x29', /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, `3 ${'of'} 4 `, C.number ? 'Satisfied' : 'Not\x20satisfied')), /* @__PURE__ */ l.createElement("li", { role: "listitem", className: C.special ? "success" : "" }, C.special ? /* @__PURE__ */ l.createElement(re, { symbol: "etds-check-icon", "aria-label": 'green\x20tick\x20icon' }) : /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-round", "aria-label": 'red\x20cross\x20icon' }), 'Use\x20at\x20least\x20one\x20special\x20character', " ", u, /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, `4 ${'of'} 4 `, C.special ? 'Satisfied' : 'Not\x20satisfied')))))), /* @__PURE__ */ l.createElement("div", { "aria-live": "polite", "aria-atomic": "true", className: "sr-only" }, e && `${'Password\x20Strength\x20\x3a'} ${x}`));
}, MD = ({
  language: e,
  handleLocaleChange: t,
  englishLabel: n,
  hindiLabel: r
}) => {
  const a = (i) => {
    t(i);
  };
  return /* @__PURE__ */ l.createElement("div", { className: "views-wrap type-2" }, /* @__PURE__ */ l.createElement("div", { className: "actions" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      id: "englishView",
      type: "button",
      onClick: () => a("en"),
      className: e === "en" ? "active" : "",
      role: "button",
      "aria-label": `${'etds-english-language-converter'}, ${e === "en" ? 'Selected' : 'Not\x20Selected'}`
    },
    /* @__PURE__ */ l.createElement("span", { className: "text" }, n)
  ), /* @__PURE__ */ l.createElement(
    "button",
    {
      id: "hindiView",
      type: "button",
      onClick: () => a("hi"),
      className: e === "hi" ? "active" : "",
      role: "button",
      "aria-label": `${'etds-hindi-language-converter'}, ${e === "hi" ? 'Selected' : 'Not\x20Selected'}`
    },
    /* @__PURE__ */ l.createElement("span", { className: "text" }, r)
  )));
};
function $D({ activeEntity: e, entityOptions: t }) {
  const [n, r] = V(!1), [a, i] = V(e), s = (c) => {
    i(c), c.url && (window.location.href = c.url);
  };
  return /* @__PURE__ */ l.createElement("div", { className: "compare-entity-box" }, /* @__PURE__ */ l.createElement("p", { className: "compare-entity-box_title" }, 'Select\x20entity\x20for\x20Comparison'), /* @__PURE__ */ l.createElement(SS, { classNames: "m-0" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      placeholder: 'Select\x20Entity',
      options: t,
      value: a,
      handleChange: s,
      setIsOpen: r,
      label: 'Select\x20Entity'
    }
  ), /* @__PURE__ */ l.createElement("div", { className: "form-group-item" }), /* @__PURE__ */ l.createElement("div", { className: "form-group-item" }), /* @__PURE__ */ l.createElement("div", { className: "form-group-item" })));
}
const FD = ({ config: e }) => {
  const [t, n] = V(!1), [r, a] = V([]), [i, s] = V([]), [c, u] = V(!1), [p, g] = V(!1), v = _e(null), y = Liferay.Icons.spritemap, E = (N) => {
    var R;
    return (R = N == null ? void 0 : N.embedded) != null && R.contentFields ? N.embedded.contentFields.map((A) => {
      const f = A.nestedContentFields || [], _ = (J) => {
        var ee;
        for (let ge = 0; ge <= 4; ge++) {
          const ie = ge === 0 ? J : `${J}_${ge}`, fe = f.find((be) => be.name === ie);
          if ((ee = fe == null ? void 0 : fe.contentFieldValue) != null && ee.data)
            return fe.contentFieldValue.data;
        }
        return "";
      }, O = _("title");
      return O ? {
        title: O,
        description: _("description"),
        announcementDate: _("announcementDate"),
        redirectionLink: _("redirectionLink")
      } : null;
    }).filter(Boolean) : [];
  }, L = async () => {
    u(!1), g(!1);
    try {
      const N = window.location.href, R = N.split("/").filter(Boolean).pop();
      console.log("Last segment:", R);
      let A;
      if (!isNaN(R))
        g(!0), A = await Ci.fetchRelatedDueDates("articleId", R);
      else if (N.includes("/w/")) {
        g(!0);
        const f = N.split("/w/")[1];
        A = await Ci.fetchRelatedDueDates("friendlyUrl", f);
      }
      s(A || []);
      return;
    } catch (N) {
      console.error("Error setting related due dates:", N), s([]);
      return;
    }
  }, x = async (N) => {
    var R;
    if (console.debug("Page navigation detected → re-initializing prompter"), console.debug("Announcement Content URL:", N), !N) {
      console.debug("No announcement content URL provided → skipping prompter initialization");
      return;
    }
    u(!0), g(!0);
    try {
      const A = await Ve.getArticleByFriendlyUrl(N), f = ((R = A == null ? void 0 : A.items) == null ? void 0 : R[0]) || A, _ = E(f);
      if ((_ == null ? void 0 : _.length) > 0) {
        a(_);
        return;
      }
    } catch (A) {
      console.error("Error fetching announcements:", A);
    }
    try {
      const A = await Ci.fetchUpcomingDueDates();
      s(A || []);
    } catch (A) {
      console.error("Error fetching upcoming due dates:", A), s([]);
    }
  };
  ye(() => {
    console.debug("Initial load → initializing prompter → " + e.prompterInstanceId), L(), Liferay.on("endNavigate", L), window.PROMPTER_REGISTRY = window.PROMPTER_REGISTRY || {}, window.PROMPTER_REGISTRY[e.prompterInstanceId] = x;
  }, []), ye(() => {
    if (!t) return;
    const N = (R) => {
      var A;
      R.key === "Escape" && !window.isRedirectionAlertOpen && (n(!1), (A = v.current) == null || A.focus());
    };
    return document.addEventListener("keydown", N), () => {
      document.removeEventListener("keydown", N);
    };
  }, [t]);
  const C = () => /* @__PURE__ */ l.createElement(
    "div",
    {
      className: `etds-natweb-notifications-card shadow-sm p-0 ${t ? "" : "hide"}`,
      id: "prompter-section",
      "aria-labelledby": "prompter-due-date-heading",
      role: "dialog",
      "aria-modal": "true",
      tabIndex: "-1"
    },
    /* @__PURE__ */ l.createElement(Ji, null, /* @__PURE__ */ l.createElement(
      "div",
      {
        className: "etds-natweb-notifications-card-header",
        id: "close-icon"
      },
      /* @__PURE__ */ l.createElement("h2", { className: "h3", id: "prompter-due-date-heading" }, c ? 'Upcoming\x20Due\x20Dates' : 'Due\x20Dates'),
      /* @__PURE__ */ l.createElement(
        "button",
        {
          style: { cursor: "pointer" },
          onClick: () => n(!1),
          "aria-label": 'Close'
        },
        /* @__PURE__ */ l.createElement("svg", { viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ l.createElement("g", { clipPath: "url(#clip0_778_17286)" }, /* @__PURE__ */ l.createElement(
          "path",
          {
            d: "M15.8337 5.3415L14.6587 4.1665L10.0003 8.82484L5.34199 4.1665L4.16699 5.3415L8.82533 9.99984L4.16699 14.6582L5.34199 15.8332L10.0003 11.1748L14.6587 15.8332L15.8337 14.6582L11.1753 9.99984L15.8337 5.3415Z",
            fill: "currentColor"
          }
        )), /* @__PURE__ */ l.createElement("defs", null, /* @__PURE__ */ l.createElement("clipPath", { id: "clip0_778_17286" }, /* @__PURE__ */ l.createElement("rect", { width: "20", height: "20", fill: "white" }))))
      )
    ), /* @__PURE__ */ l.createElement(
      "div",
      {
        className: "etds-natweb-notifications-cards",
        role: "list",
        "aria-label": 'Announcements'
      },
      (i == null ? void 0 : i.length) == 0 && /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-row" }, /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-content" }, /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-content-header" }, /* @__PURE__ */ l.createElement("p", { className: "etds-natweb-notifications-card-content__p" }, c ? 'No\x20upcoming\x20due\x20dates' : 'etds-no-relevant-due-dates'))))),
      i == null ? void 0 : i.map((N, R) => /* @__PURE__ */ l.createElement("div", { key: R, className: "etds-natweb-notifications-card-row", role: "listitem" }, /* @__PURE__ */ l.createElement("div", { className: "etds-prompters-card-row-svg-wrapper", "aria-label": 'Graphic\x20calander' }, /* @__PURE__ */ l.createElement("p", { className: "etds-natweb-red-dot" }), /* @__PURE__ */ l.createElement(
        "svg",
        {
          width: "24",
          height: "24",
          viewBox: "0 0 24 24",
          fill: "none",
          xmlns: "http://www.w3.org/2000/svg"
        },
        /* @__PURE__ */ l.createElement("g", { clipPath: "url(#clip0_44519_19620)" }, /* @__PURE__ */ l.createElement(
          "path",
          {
            d: "M19 3H18V1H16V3H8V1H6V3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V9H19V19ZM5 7V5H19V7H5ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z",
            fill: "#51169D"
          }
        )),
        /* @__PURE__ */ l.createElement("defs", null, /* @__PURE__ */ l.createElement("clipPath", { id: "clip0_44519_19620" }, /* @__PURE__ */ l.createElement("rect", { width: "24", height: "24", fill: "white" })))
      )), /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-content" }, /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-content-header" }, /* @__PURE__ */ l.createElement("p", { className: "etds-natweb-notifications-card-content__p" }, F.formatDate(N.dueDate, "dd MMMM yyyy"))), /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-content-footer" }, /* @__PURE__ */ l.createElement("p", { className: "etds-natweb-notifications-card-content-footer__p" }, /* @__PURE__ */ l.createElement(
        "div",
        {
          className: "description",
          dangerouslySetInnerHTML: {
            __html: N.shortDescription
          }
        }
      ))))))
    ), /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-footer" }, /* @__PURE__ */ l.createElement(
      "button",
      {
        onClick: () => window.open(e == null ? void 0 : e.taxCalendarPageUrl, "_blank")
      },
      'Go\x20to\x20Tax\x20Calendar'
    )))
  ), T = () => (console.log("Rendering upcoming due dates prompter..."), /* @__PURE__ */ l.createElement(jr, { spritemap: y }, /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-wrapper etds-prompters" }, /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      className: `etds-natweb-notifications-icon ${t ? "active" : ""}`,
      id: "prompter-id",
      ref: v,
      onClick: () => n(!t),
      style: { cursor: "pointer" },
      "aria-label": `${'Prompter'} (${(i == null ? void 0 : i.length) || 0}) ${'Announcements'}}`,
      "aria-expanded": t,
      "aria-controls": "prompts-panel",
      role: "button"
    },
    /* @__PURE__ */ l.createElement("p", { className: "etds-natweb-red-dot etds-natweb-red-dot--count", "aria-hidden": "true" }, i == null ? void 0 : i.length),
    /* @__PURE__ */ l.createElement("div", { className: "etds-prompters-icon-wrapper" }, /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: t ? "etds-header-announcement-active" : "etds-header-announcement",
        className: "fs-1-25"
      }
    ))
  ), C())))), D = () => {
    const N = (R) => {
      if (!R || typeof R != "string") return "";
      const A = document.createElement("div");
      return A.innerHTML = R, A.textContent || A.innerText || "";
    };
    return /* @__PURE__ */ l.createElement(
      "div",
      {
        className: `etds-natweb-notifications-card shadow-sm p-0 ${t ? "" : "hide"}`,
        id: "prompter-section",
        "aria-labelledby": "prompter-heading",
        role: "dialog",
        "aria-modal": "true",
        tabIndex: "-1"
      },
      /* @__PURE__ */ l.createElement(Ji, null, /* @__PURE__ */ l.createElement(
        "div",
        {
          className: "etds-natweb-notifications-card-header",
          id: "close-icon"
        },
        /* @__PURE__ */ l.createElement("h2", { className: "h3", id: "prompter-heading" }, 'Announcements'),
        /* @__PURE__ */ l.createElement(
          "button",
          {
            style: { cursor: "pointer" },
            onClick: () => n(!1),
            "aria-label": "Close"
          },
          /* @__PURE__ */ l.createElement("svg", { viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ l.createElement("g", { clipPath: "url(#clip0_778_17286)" }, /* @__PURE__ */ l.createElement(
            "path",
            {
              d: "M15.8337 5.3415L14.6587 4.1665L10.0003 8.82484L5.34199 4.1665L4.16699 5.3415L8.82533 9.99984L4.16699 14.6582L5.34199 15.8332L10.0003 11.1748L14.6587 15.8332L15.8337 14.6582L11.1753 9.99984L15.8337 5.3415Z",
              fill: "currentColor"
            }
          )), /* @__PURE__ */ l.createElement("defs", null, /* @__PURE__ */ l.createElement("clipPath", { id: "clip0_778_17286" }, /* @__PURE__ */ l.createElement("rect", { width: "20", height: "20", fill: "white" }))))
        )
      ), /* @__PURE__ */ l.createElement(
        "div",
        {
          className: "etds-natweb-notifications-cards",
          role: "list",
          "aria-label": `${'Announcements'} ${'List\x20with'} ${(r == null ? void 0 : r.length) || 0} ${'items'}`
        },
        r == null ? void 0 : r.map((R, A) => /* @__PURE__ */ l.createElement(
          "div",
          {
            key: A,
            className: "etds-natweb-notifications-card-row",
            role: "listitem"
          },
          /* @__PURE__ */ l.createElement("div", { className: "etds-prompters-card-row-svg-wrapper", "aria-label": 'Graphic\x20calander' }, /* @__PURE__ */ l.createElement("p", { className: "etds-natweb-red-dot" }), /* @__PURE__ */ l.createElement(
            "svg",
            {
              width: "24",
              height: "24",
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg"
            },
            /* @__PURE__ */ l.createElement("g", { clipPath: "url(#clip0_44519_19620)" }, /* @__PURE__ */ l.createElement(
              "path",
              {
                d: "M19 3H18V1H16V3H8V1H6V3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V9H19V19ZM5 7V5H19V7H5ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z",
                fill: "#51169D"
              }
            )),
            /* @__PURE__ */ l.createElement("defs", null, /* @__PURE__ */ l.createElement("clipPath", { id: "clip0_44519_19620" }, /* @__PURE__ */ l.createElement("rect", { width: "24", height: "24", fill: "white" })))
          )),
          /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-content" }, /* @__PURE__ */ l.createElement(
            "div",
            {
              className: "etds-natweb-notifications-card-content-header",
              id: "report-container"
            },
            /* @__PURE__ */ l.createElement(
              "p",
              {
                className: "etds-natweb-notifications-card-content__p",
                dangerouslySetInnerHTML: {
                  __html: R.description
                }
              }
            )
          ), /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications-card-content-footer" }, R.announcementDate && /* @__PURE__ */ l.createElement("p", { className: "etds-natweb-notifications-card-content-footer__p" }, new Date(R.announcementDate).toLocaleDateString(
            `${themeDisplay.getBCP47LanguageId()}`,
            { month: "long", day: "2-digit", year: "numeric" }
          )), R.redirectionLink && /* @__PURE__ */ l.createElement(
            "button",
            {
              className: "btn btn-sm etds-natweb-notifications-card-content-footer__button",
              onClick: () => window.open(R.redirectionLink, "_blank"),
              "aria-label": `${'Access\x20announcement'} ${N(R.description)}`
            },
            'Access'
          )))
        ))
      ))
    );
  }, k = () => (console.log("Rendering announcements prompter..."), /* @__PURE__ */ l.createElement(jr, { spritemap: y }, /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-wrapper etds-prompters etds-prompters--announcement" }, /* @__PURE__ */ l.createElement("div", { className: "etds-natweb-notifications" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      className: `etds-natweb-notifications-icon ${t ? "active" : ""}`,
      id: "prompter-id",
      ref: v,
      onClick: () => n(!t),
      style: { cursor: "pointer" },
      "aria-label": `${'Prompter'} (${(r == null ? void 0 : r.length) || 0}) ${'Announcements'}}`,
      "aria-expanded": t,
      "aria-controls": "prompts-panel",
      role: "button"
    },
    /* @__PURE__ */ l.createElement("span", { className: "sr-only", "aria-live": "polite" }, t ? `${'Announcements\x20panel\x20expanded'} ${(r == null ? void 0 : r.length) || 0} ${'Announcements'}` : `${'Announcements\x20panel\x20collapsed'} ${(r == null ? void 0 : r.length) || 0} ${'Announcements'}`),
    /* @__PURE__ */ l.createElement(
      "p",
      {
        className: "etds-natweb-red-dot etds-natweb-red-dot--count",
        id: "totalCount",
        "aria-hidden": "true"
      },
      r == null ? void 0 : r.length
    ),
    /* @__PURE__ */ l.createElement("div", { className: "etds-prompters-icon-wrapper" }, /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: t ? "etds-header-announcement-active" : "etds-header-announcement",
        className: "fs-1-25"
      }
    ))
  ), D()))));
  return /* @__PURE__ */ l.createElement(l.Fragment, null, p && c && ((r == null ? void 0 : r.length) > 0 ? k() : T()), p && !c && i.length > 0 && T());
}, _D = ({ config: e }) => {
  function n() {
    const r = localStorage.getItem(e.visitorIdKey), a = localStorage.getItem(e.visitorExpiryKey), i = (/* @__PURE__ */ new Date()).getTime();
    if (!r || !a || i > parseInt(a, 10)) {
      const s = crypto.randomUUID();
      return localStorage.setItem(e.visitorIdKey, s), localStorage.setItem(e.visitorExpiryKey, (i + 18e5).toString()), s;
    }
    return localStorage.setItem(e.visitorExpiryKey, (i + 18e5).toString()), r;
  }
  return ye(async () => {
    const r = n();
    if (r && await Ve.addVisitorIdInResponseHeader(r), !(typeof elasticApm > "u" || !e.serverUrl))
      try {
        window.apm = elasticApm.init({
          serviceName: e.serviceName,
          serverUrl: e.serverUrl,
          environment: e.environment,
          transactionSampleRate: e.transactionSampleRate,
          centralConfig: e.centralConfig,
          logLevel: e.logLevel
        });
        const a = apm.getCurrentTransaction();
        if (a) {
          const i = a.traceId;
          window.trace_Id = i, a.addLabels({
            traceId: i,
            userName: themeDisplay.getUserName() || "Guest",
            screenName: themeDisplay.getLayoutURL,
            applicationInstance: e.applicationInstance,
            visitorId: r
          });
        }
      } catch (a) {
        console.error("Error initializing Elastic APM:", a);
      }
  }, []), /* @__PURE__ */ l.createElement(l.Fragment, null);
}, AS = {
  emptySearch: !0,
  erc: "RELATED_CONENT_LOCALIZED_BP_ERC"
}, jD = ({ articleData: e, additionalItems: t = [], cssBottom: n = "" }) => {
  const r = Liferay.Icons.spritemap, [a, i] = V([]), s = async () => {
    var C;
    if (console.log("Passed Article Details"), console.log(e), !e) {
      console.warn("Please provide an Article to the Related Data");
      return;
    }
    console.log("Attached Related Contents: "), console.log(e == null ? void 0 : e.relatedContents);
    let v = [], y = [], E = [];
    (C = e == null ? void 0 : e.relatedContents) != null && C.length && e.relatedContents.forEach((T) => {
      const D = {
        id: T.id,
        title: T.title,
        redirectionLink: T.redirectionLink,
        contentType: T.contentType,
        content: T.content
      };
      T.contentType === "Document" ? v.push(D) : y.push(D);
    });
    const L = y.map(
      (T) => T.id
    );
    if (L.length > 0) {
      const T = F.createSearchBody({ article_ids: L.join(",") }, AS), D = {
        nestedFields: "embedded",
        pageSize: -1,
        fields: "embedded.id,title"
      };
      try {
        const k = await Ve.getSearchResults(T, D);
        E = ((k == null ? void 0 : k.items) || []).map((N) => {
          var R;
          return {
            id: (R = N == null ? void 0 : N.embedded) == null ? void 0 : R.id,
            title: N.title,
            redirectionLink: "",
            contentType: "StructuredContent",
            content: ""
          };
        });
      } catch (k) {
        console.error("Error while calling related content localized api ", k);
      }
    }
    let x = [];
    console.log("Additional Related Contents: "), console.log(t), t && t.length && (x = t.map((T) => ({
      title: T.title,
      redirectionLink: T.redirectionLink,
      id: T.id || "",
      contentType: T.contentType || "",
      content: T.content || ""
    }))), i([...E, ...v, ...x]);
  }, c = async (v, y) => {
    if (console.log("Clicked Item Details, Index: " + v), console.log(y), y.redirectionLink) {
      OpenFormByType(y.redirectionLink);
      return;
    }
    const E = [...a];
    if (y.contentType === "Document") {
      let L = await Ve.fetchDocumentByDocumentId(y.id);
      E[v].redirectionLink = F.removeUrlAttribute(L == null ? void 0 : L.contentUrl, "download"), window.open(E[v].redirectionLink, "_blank");
    } else y.contentType === "StructuredContent" && window.openDocumentViewer("Other", "articleId", y.id, null, null, Date.now());
    i(E);
  };
  ye(() => {
    s();
  }, []);
  const [u, p] = V(!1), g = u ? a : a.slice(0, 5);
  return /* @__PURE__ */ l.createElement(jr, { spritemap: r }, /* @__PURE__ */ l.createElement(vl, null, /* @__PURE__ */ l.createElement(
    "div",
    {
      className: `related-content-container ${a.length > 0 ? n : ""}`,
      role: "group",
      "aria-label": 'Relevant\x20Content'
    },
    /* @__PURE__ */ l.createElement("div", { className: `related-title mb-2 ${a.length > 0 ? " " : "d-none"}` }, 'Relevant\x20Content'),
    /* @__PURE__ */ l.createElement("div", { class: "container p-0" }, /* @__PURE__ */ l.createElement("div", { class: "d-flex related-content-content-row" }, g && g.length > 0 && g.map((v, y) => /* @__PURE__ */ l.createElement("div", { key: y, className: "d-flex align-items-center content-section" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-open-in-new-tab-sm" }), /* @__PURE__ */ l.createElement(
      "a",
      {
        key: y,
        href: v.redirectionLink || "#",
        target: "_blank",
        rel: "noopener noreferrer",
        "data-id": v.id,
        "data-contenttype": v.contentType,
        title: v.title,
        onClick: (E) => {
          E.preventDefault(), c(y, v);
        }
      },
      v.title
    )))), a.length > 5 && /* @__PURE__ */ l.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-link btn-view-more-less",
        onClick: () => p((v) => !v),
        style: { marginTop: "8px" }
      },
      u ? 'View\x20Less' : 'View\x20More'
    ))
  )));
}, OS = ({ updatedDate: e, etdsConfigContext: t, label: n = 'New\x21' }) => {
  const r = () => {
    var c;
    const a = /* @__PURE__ */ new Date(), i = new Date(e);
    return (a - i) / (1e3 * 60 * 60 * 24) <= ((c = t == null ? void 0 : t.globalConfig) == null ? void 0 : c.newTagThresholdDays);
  };
  return /* @__PURE__ */ l.createElement(l.Fragment, null, r() && /* @__PURE__ */ l.createElement("div", { className: "new-badge" }, /* @__PURE__ */ l.createElement("span", null, n)));
}, Op = dd(), VD = ({ children: e, featureConfigErc: t }) => {
  const [n, r] = V({}), [a, i] = V(), [s, c] = V(), u = async () => {
    console.debug("Configurations Provider: API call to get Feature Configurations");
    try {
      const v = await (await Liferay.Util.fetch(
        `/o/c/featureconfigurations/by-external-reference-code/${t}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      )).json();
      return console.debug("Feature Configurations Details"), console.debug(v), i(v || {}), v || {};
    } catch (g) {
      console.error("Error while fetching configurations:", g);
    }
  }, p = async () => {
    console.debug("Configurations Provider: API call to get Global Configurations");
    try {
      const v = await (await Liferay.Util.fetch(
        "/o/c/globalconfigurations/by-external-reference-code/GLOBAL_CONFIGURATIONS",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      )).json();
      return console.debug("Global Configurations Details"), console.debug(v), c(v || {}), v || {};
    } catch (g) {
      console.error("Error while fetching configurations:", g);
    }
  };
  return ye(() => {
    if (!a) {
      u();
      return;
    }
    if (!s) {
      console.log("Global Configurations will be fetched"), p();
      return;
    }
    r({ featureConfig: a, globalConfig: s });
  }, [s, a]), /* @__PURE__ */ l.createElement(Op.Provider, { value: n }, e);
}, MS = () => Un(Op), $S = ({ label: e = 'Enter\x20atleast\x203\x20characters\x2e\x20e\x2eg\x2e\x2c\x20tax\x20or\x20TDS' }) => {
  const [t, n] = V(!1), r = () => n(!1), a = () => n(!0), i = Liferay.Icons.spritemap;
  return /* @__PURE__ */ l.createElement(jr, { spritemap: i }, /* @__PURE__ */ l.createElement(
    Rp,
    {
      title: e,
      placement: "top",
      arrow: !0,
      open: t,
      onClose: r
    },
    /* @__PURE__ */ l.createElement(
      "span",
      {
        className: "load-time",
        tabIndex: "0",
        onMouseEnter: a,
        onMouseLeave: r,
        onFocus: a,
        onBlur: r,
        onClick: a
      },
      e
    )
  ));
}, UD = ({
  currentPage: e,
  totalPages: t,
  totalRecordsCount: n,
  itemsPerPage: r,
  receivedItems: a,
  loadTime: i,
  jumpToPage: s,
  setJumpToPage: c,
  handlePageChange: u,
  extraCssClass: p = "",
  eventTitle: g = "",
  eventLabel: v = "",
  inputNumberDisabled: y = !1
}) => {
  const E = Liferay.ThemeDisplay.getLanguageId();
  function L(k) {
    const N = /^[0-9\b]+$/, R = k.target.value;
    (R == "" || N.test(R) && R > 0 && R <= t) && (c(R == "" ? "" : Number(R)), C(k));
  }
  function x() {
    e !== s && (s != "" && s > 0 && s <= t ? u(s) : (c(e), C({ target: { id: "pagination-input-box" } })));
  }
  const C = (k) => {
    localStorage.setItem("lastFocusedElement", k.target.id);
  };
  ye(() => {
    const k = document.getElementById("pagination-live-region");
    if (!k) return;
    const N = n > 0 ? Number(r) * (e - 1) + 1 : 0, R = Number(r) * (e - 1) + a;
    k.textContent = "", setTimeout(() => {
      const A = Liferay.ThemeDisplay.getLanguageId();
      let f = "";
      A === "hi_IN" ? f = `${'Page'} ${e} ${'Loaded\x2e'} ${N} ${'to'} ${R} ${'of'} ${n} ${'Showing\x20items'}` : f = `${'Page'} ${e} ${'Loaded\x2e'} ${'Showing\x20items'} ${N} ${'to'} ${R} ${'of'} ${n}.`, k.textContent = f;
    }, 100);
  }, [e, a, n, r]), ye(() => {
    const k = localStorage.getItem("lastFocusedElement"), N = document.getElementById("pagination-input-box"), R = document.getElementById("pagination-previous-button");
    if (k) {
      const A = document.getElementById(k);
      A != null && A.disabled ? k === "pagination-next-button" ? (R == null || R.focus(), R == null || R.scrollIntoView({ behavior: "smooth", block: "center" })) : (N == null || N.focus(), N == null || N.scrollIntoView({ behavior: "smooth", block: "center" })) : (A == null || A.focus(), A == null || A.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    localStorage.removeItem("lastFocusedElement");
  }, [e]);
  function T() {
    document.querySelector("#main-content").scrollIntoView();
  }
  const D = `${'Loaded\x20in'} : ${i.toFixed(2)} ${'seconds'}`;
  return n > 0 ? /* @__PURE__ */ l.createElement("div", { className: `pagination-wrapper ${p}`, role: "region", "aria-label": 'Pagination' }, /* @__PURE__ */ l.createElement(
    "div",
    {
      id: "pagination-live-region",
      "aria-live": "polite",
      "aria-atomic": "true",
      className: "sr-only"
    }
  ), /* @__PURE__ */ l.createElement("div", { className: "pagination-first-section d-flex" }, g != "" ? /* @__PURE__ */ l.createElement("span", { className: "event-title", title: g }, g) : /* @__PURE__ */ l.createElement(l.Fragment, null, E === "hi_IN" ? /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("span", { className: "part-1 mr-1" }, n + " " + 'items' + " ", 'of'), /* @__PURE__ */ l.createElement("span", { className: "part-2" }, n > 0 ? Number(r) * (e - 1) + 1 : 0, " ", "- ", Number(r) * (e - 1) + a)) : /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("span", { className: "part-1" }, n > 0 ? Number(r) * (e - 1) + 1 : 0, " ", "- ", Number(r) * (e - 1) + a, " ", 'of'), /* @__PURE__ */ l.createElement("span", { className: "part-2" }, " " + n + " " + 'items'))), /* @__PURE__ */ l.createElement("span", { className: "vertical-border" }), /* @__PURE__ */ l.createElement($S, { label: D })), /* @__PURE__ */ l.createElement("div", { className: "pagination-pages" }, /* @__PURE__ */ l.createElement("div", { className: "jump-to-page" }, /* @__PURE__ */ l.createElement("span", { className: "go-to" }, 'Go\x20to'), /* @__PURE__ */ l.createElement(
    "input",
    {
      id: "pagination-input-box",
      type: "text",
      name: "jump-to-page",
      value: s,
      className: "form-control p-0",
      onChange: L,
      onBlur: x,
      onKeyDown: (k) => {
        k.key === "Enter" && (k.preventDefault(), x(), T(), C(k));
      },
      disabled: y,
      "aria-label": `Page number ${s || e} of ${t}`
    }
  ), /* @__PURE__ */ l.createElement("span", { className: "total-pages", "aria-hidden": "true" }, E === "hi_IN" ? /* @__PURE__ */ l.createElement(l.Fragment, null, t, " ", v, " ", 'of') : /* @__PURE__ */ l.createElement(l.Fragment, null, 'of', " ", v, " ", t))), /* @__PURE__ */ l.createElement("div", { className: "prev-next-wrap" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      id: "pagination-previous-button",
      disabled: e <= 1,
      onClick: (k) => {
        u(e - 1), T(), C(k);
      },
      tabIndex: 0
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-left-pagination-arrow" }),
    'Previous'
  ), /* @__PURE__ */ l.createElement("span", { className: "vertical-border" }), /* @__PURE__ */ l.createElement(
    "button",
    {
      id: "pagination-next-button",
      disabled: e >= t,
      onClick: (k) => {
        u(e + 1), T(), C(k);
      },
      tabIndex: 0
    },
    'Next',
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-right-pagination-arrow" })
  )))) : null;
};
var Mp = { exports: {} };
/*!
	Copyright (c) 2018 Jed Watson.
	Licensed under the MIT License (MIT), see
	http://jedwatson.github.io/classnames
*/
(function(e) {
  (function() {
    var t = {}.hasOwnProperty;
    function n() {
      for (var i = "", s = 0; s < arguments.length; s++) {
        var c = arguments[s];
        c && (i = a(i, r(c)));
      }
      return i;
    }
    function r(i) {
      if (typeof i == "string" || typeof i == "number")
        return i;
      if (typeof i != "object")
        return "";
      if (Array.isArray(i))
        return n.apply(null, i);
      if (i.toString !== Object.prototype.toString && !i.toString.toString().includes("[native code]"))
        return i.toString();
      var s = "";
      for (var c in i)
        t.call(i, c) && i[c] && (s = a(s, c));
      return s;
    }
    function a(i, s) {
      return s ? i ? i + " " + s : i + s : i;
    }
    e.exports ? (n.default = n, e.exports = n) : window.classNames = n;
  })();
})(Mp);
var FS = Mp.exports;
const cr = /* @__PURE__ */ no(FS);
function Zu(e) {
  return "default" + e.charAt(0).toUpperCase() + e.substr(1);
}
function _S(e) {
  var t = jS(e, "string");
  return typeof t == "symbol" ? t : String(t);
}
function jS(e, t) {
  if (typeof e != "object" || e === null) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(e);
}
function VS(e, t, n) {
  var r = _e(e !== void 0), a = V(t), i = a[0], s = a[1], c = e !== void 0, u = r.current;
  return r.current = c, !c && u && i !== t && s(t), [c ? e : i, vt(function(p) {
    for (var g = arguments.length, v = new Array(g > 1 ? g - 1 : 0), y = 1; y < g; y++)
      v[y - 1] = arguments[y];
    n && n.apply(void 0, [p].concat(v)), s(p);
  }, [n])];
}
function ac(e, t) {
  return Object.keys(t).reduce(function(n, r) {
    var a, i = n, s = i[Zu(r)], c = i[r], u = vn(i, [Zu(r), r].map(_S)), p = t[r], g = VS(c, s, e[p]), v = g[0], y = g[1];
    return Z({}, u, (a = {}, a[r] = v, a[p] = y, a));
  }, e);
}
var ic = /* @__PURE__ */ l.createContext({});
ic.Consumer;
ic.Provider;
function va(e, t) {
  var n = Un(ic);
  return e || n[t] || t;
}
var za = /* @__PURE__ */ l.createContext(null), Qi = function(t, n) {
  return n === void 0 && (n = null), t != null ? String(t) : n || null;
};
function US(e) {
  return e && e.ownerDocument || document;
}
function BS(e) {
  var t = US(e);
  return t && t.defaultView || window;
}
function HS(e, t) {
  return BS(e).getComputedStyle(e, t);
}
var zS = /([A-Z])/g;
function qS(e) {
  return e.replace(zS, "-$1").toLowerCase();
}
var WS = /^ms-/;
function xi(e) {
  return qS(e).replace(WS, "-ms-");
}
var YS = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;
function GS(e) {
  return !!(e && YS.test(e));
}
function $p(e, t) {
  var n = "", r = "";
  if (typeof t == "string")
    return e.style.getPropertyValue(xi(t)) || HS(e).getPropertyValue(xi(t));
  Object.keys(t).forEach(function(a) {
    var i = t[a];
    !i && i !== 0 ? e.style.removeProperty(xi(a)) : GS(a) ? r += a + "(" + i + ") " : n += xi(a) + ": " + i + ";";
  }), r && (n += "transform: " + r + ";"), e.style.cssText += ";" + n;
}
const KS = !!(typeof window < "u" && window.document && window.document.createElement);
var pl = !1, ml = !1;
try {
  var As = {
    get passive() {
      return pl = !0;
    },
    get once() {
      return ml = pl = !0;
    }
  };
  KS && (window.addEventListener("test", As, As), window.removeEventListener("test", As, !0));
} catch {
}
function JS(e, t, n, r) {
  if (r && typeof r != "boolean" && !ml) {
    var a = r.once, i = r.capture, s = n;
    !ml && a && (s = n.__once || function c(u) {
      this.removeEventListener(t, c, i), n.call(this, u);
    }, n.__once = s), e.addEventListener(t, s, pl ? r : i);
  }
  e.addEventListener(t, n, r);
}
function QS(e, t, n, r) {
  var a = r && typeof r != "boolean" ? r.capture : r;
  e.removeEventListener(t, n, a), n.__once && e.removeEventListener(t, n.__once, a);
}
function Fp(e, t, n, r) {
  return JS(e, t, n, r), function() {
    QS(e, t, n, r);
  };
}
function XS(e, t, n, r) {
  if (r === void 0 && (r = !0), e) {
    var a = document.createEvent("HTMLEvents");
    a.initEvent(t, n, r), e.dispatchEvent(a);
  }
}
function ZS(e) {
  var t = $p(e, "transitionDuration") || "", n = t.indexOf("ms") === -1 ? 1e3 : 1;
  return parseFloat(t) * n;
}
function eT(e, t, n) {
  n === void 0 && (n = 5);
  var r = !1, a = setTimeout(function() {
    r || XS(e, "transitionend", !0);
  }, t + n), i = Fp(e, "transitionend", function() {
    r = !0;
  }, {
    once: !0
  });
  return function() {
    clearTimeout(a), i();
  };
}
function tT(e, t, n, r) {
  n == null && (n = ZS(e) || 0);
  var a = eT(e, n, r), i = Fp(e, "transitionend", t);
  return function() {
    a(), i();
  };
}
function ed(e, t) {
  var n = $p(e, t) || "", r = n.indexOf("ms") === -1 ? 1e3 : 1;
  return parseFloat(n) * r;
}
function nT(e, t) {
  var n = ed(e, "transitionDuration"), r = ed(e, "transitionDelay"), a = tT(e, function(i) {
    i.target === e && (a(), t(i));
  }, n + r);
}
function rT() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return t.filter(function(r) {
    return r != null;
  }).reduce(function(r, a) {
    if (typeof a != "function")
      throw new Error("Invalid Argument Type, must only provide functions, undefined, or null.");
    return r === null ? a : function() {
      for (var s = arguments.length, c = new Array(s), u = 0; u < s; u++)
        c[u] = arguments[u];
      r.apply(this, c), a.apply(this, c);
    };
  }, null);
}
function aT(e) {
  e.offsetHeight;
}
function iT(e) {
  const t = _e(e);
  return ye(() => {
    t.current = e;
  }, [e]), t;
}
function oT(e) {
  const t = iT(e);
  return vt(function(...n) {
    return t.current && t.current(...n);
  }, [t]);
}
var sT = ["className", "children"], Ei, lT = {
  in: !1,
  timeout: 300,
  mountOnEnter: !1,
  unmountOnExit: !1,
  appear: !1
}, cT = (Ei = {}, Ei[xr] = "show", Ei[Fr] = "show", Ei), oc = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n = e.className, r = e.children, a = vn(e, sT), i = vt(function(s) {
    aT(s), a.onEnter && a.onEnter(s);
  }, [a]);
  return /* @__PURE__ */ l.createElement(nr, Z({
    ref: t,
    addEndListener: nT
  }, a, {
    onEnter: i
  }), function(s, c) {
    return /* @__PURE__ */ l.cloneElement(r, Z({}, c, {
      className: cr("fade", n, r.props.className, cT[s])
    }));
  });
});
oc.defaultProps = lT;
oc.displayName = "Fade";
var uT = ["as", "disabled", "onKeyDown"];
function td(e) {
  return !e || e.trim() === "#";
}
var sc = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n = e.as, r = n === void 0 ? "a" : n, a = e.disabled, i = e.onKeyDown, s = vn(e, uT), c = function(g) {
    var v = s.href, y = s.onClick;
    if ((a || td(v)) && g.preventDefault(), a) {
      g.stopPropagation();
      return;
    }
    y && y(g);
  }, u = function(g) {
    g.key === " " && (g.preventDefault(), c(g));
  };
  return td(s.href) && (s.role = s.role || "button", s.href = s.href || "#"), a && (s.tabIndex = -1, s["aria-disabled"] = !0), /* @__PURE__ */ l.createElement(r, Z({
    ref: t
  }, s, {
    onClick: c,
    onKeyDown: rT(u, i)
  }));
});
sc.displayName = "SafeAnchor";
var dT = ["bsPrefix", "variant", "size", "active", "className", "block", "type", "as"], fT = {
  variant: "primary",
  active: !1,
  disabled: !1
}, lc = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n = e.bsPrefix, r = e.variant, a = e.size, i = e.active, s = e.className, c = e.block, u = e.type, p = e.as, g = vn(e, dT), v = va(n, "btn"), y = cr(s, v, i && "active", r && v + "-" + r, c && v + "-block", a && v + "-" + a);
  if (g.href)
    return /* @__PURE__ */ l.createElement(sc, Z({}, g, {
      as: p,
      ref: t,
      className: cr(y, g.disabled && "disabled")
    }));
  t && (g.ref = t), u ? g.type = u : p || (g.type = "button");
  var E = p || "button";
  return /* @__PURE__ */ l.createElement(E, Z({}, g, {
    className: y
  }));
});
lc.displayName = "Button";
lc.defaultProps = fT;
var _p = /* @__PURE__ */ l.createContext(null);
_p.displayName = "CardContext";
function nd(e, t) {
  var n = 0;
  return l.Children.map(e, function(r) {
    return /* @__PURE__ */ l.isValidElement(r) ? t(r, n++) : r;
  });
}
function pT(e, t) {
  var n = 0;
  l.Children.forEach(e, function(r) {
    /* @__PURE__ */ l.isValidElement(r) && t(r, n++);
  });
}
var mT = Function.prototype.bind.call(Function.prototype.call, [].slice);
function gT(e, t) {
  return mT(e.querySelectorAll(t));
}
function hT() {
  const [, e] = cd((t) => !t, !1);
  return e;
}
var cc = /* @__PURE__ */ l.createContext(null);
cc.displayName = "NavContext";
const rd = (e) => !e || typeof e == "function" ? e : (t) => {
  e.current = t;
};
function vT(e, t) {
  const n = rd(e), r = rd(t);
  return (a) => {
    n && n(a), r && r(a);
  };
}
function yT(e, t) {
  return rn(() => vT(e, t), [e, t]);
}
var jp = /* @__PURE__ */ l.createContext(null);
jp.displayName = "NavbarContext";
var ad = { exports: {} };
(function(e, t) {
  Object.defineProperty(t, "__esModule", {
    value: !0
  }), t.default = n;
  function n(r) {
    return function(i, s, c, u, p) {
      var g = c || "<<anonymous>>", v = p || s;
      if (i[s] == null)
        return new Error("The " + u + " `" + v + "` is required to make " + ("`" + g + "` accessible for users of assistive ") + "technologies such as screen readers.");
      for (var y = arguments.length, E = Array(y > 5 ? y - 5 : 0), L = 5; L < y; L++)
        E[L - 5] = arguments[L];
      return r.apply(void 0, [i, s, c, u, p].concat(E));
    };
  }
  e.exports = t.default;
})(ad, ad.exports);
var id = { exports: {} }, gl = { exports: {} };
(function(e, t) {
  Object.defineProperty(t, "__esModule", {
    value: !0
  }), t.default = n;
  function n(r) {
    function a(s, c, u, p, g, v) {
      var y = p || "<<anonymous>>", E = v || u;
      if (c[u] == null)
        return s ? new Error("Required " + g + " `" + E + "` was not specified " + ("in `" + y + "`.")) : null;
      for (var L = arguments.length, x = Array(L > 6 ? L - 6 : 0), C = 6; C < L; C++)
        x[C - 6] = arguments[C];
      return r.apply(void 0, [c, u, y, g, E].concat(x));
    }
    var i = a.bind(null, !1);
    return i.isRequired = a.bind(null, !0), i;
  }
  e.exports = t.default;
})(gl, gl.exports);
var bT = gl.exports;
(function(e, t) {
  Object.defineProperty(t, "__esModule", {
    value: !0
  }), t.default = i;
  var n = bT, r = a(n);
  function a(s) {
    return s && s.__esModule ? s : { default: s };
  }
  function i() {
    for (var s = arguments.length, c = Array(s), u = 0; u < s; u++)
      c[u] = arguments[u];
    function p() {
      for (var g = arguments.length, v = Array(g), y = 0; y < g; y++)
        v[y] = arguments[y];
      var E = null;
      return c.forEach(function(L) {
        if (E == null) {
          var x = L.apply(void 0, v);
          x != null && (E = x);
        }
      }), E;
    }
    return (0, r.default)(p);
  }
  e.exports = t.default;
})(id, id.exports);
var Po = /* @__PURE__ */ l.createContext(null), wT = ["as", "onSelect", "activeKey", "role", "onKeyDown"], od = function() {
}, xT = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n = e.as, r = n === void 0 ? "ul" : n, a = e.onSelect, i = e.activeKey, s = e.role, c = e.onKeyDown, u = vn(e, wT), p = hT(), g = _e(!1), v = Un(za), y = Un(Po), E, L;
  y && (s = s || "tablist", i = y.activeKey, E = y.getControlledId, L = y.getControllerId);
  var x = _e(null), C = function(R) {
    var A = x.current;
    if (!A) return null;
    var f = gT(A, "[data-rb-event-key]:not(.disabled)"), _ = A.querySelector(".active");
    if (!_) return null;
    var O = f.indexOf(_);
    if (O === -1) return null;
    var J = O + R;
    return J >= f.length && (J = 0), J < 0 && (J = f.length - 1), f[J];
  }, T = function(R, A) {
    R != null && (a && a(R, A), v && v(R, A));
  }, D = function(R) {
    c && c(R);
    var A;
    switch (R.key) {
      case "ArrowLeft":
      case "ArrowUp":
        A = C(-1);
        break;
      case "ArrowRight":
      case "ArrowDown":
        A = C(1);
        break;
      default:
        return;
    }
    A && (R.preventDefault(), T(A.dataset.rbEventKey, R), g.current = !0, p());
  };
  ye(function() {
    if (x.current && g.current) {
      var N = x.current.querySelector("[data-rb-event-key].active");
      N && N.focus();
    }
    g.current = !1;
  });
  var k = yT(t, x);
  return /* @__PURE__ */ l.createElement(za.Provider, {
    value: T
  }, /* @__PURE__ */ l.createElement(cc.Provider, {
    value: {
      role: s,
      // used by NavLink to determine it's role
      activeKey: Qi(i),
      getControlledId: E || od,
      getControllerId: L || od
    }
  }, /* @__PURE__ */ l.createElement(r, Z({}, u, {
    onKeyDown: D,
    ref: k,
    role: s
  }))));
}), ET = ["active", "className", "eventKey", "onSelect", "onClick", "as"], LT = {
  disabled: !1
}, Vp = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n = e.active, r = e.className, a = e.eventKey, i = e.onSelect, s = e.onClick, c = e.as, u = vn(e, ET), p = Qi(a, u.href), g = Un(za), v = Un(cc), y = n;
  if (v) {
    !u.role && v.role === "tablist" && (u.role = "tab");
    var E = v.getControllerId(p), L = v.getControlledId(p);
    u["data-rb-event-key"] = p, u.id = E || u.id, u["aria-controls"] = L || u["aria-controls"], y = n == null && p != null ? v.activeKey === p : n;
  }
  u.role === "tab" && (u.disabled && (u.tabIndex = -1, u["aria-disabled"] = !0), u["aria-selected"] = y);
  var x = oT(function(C) {
    s && s(C), p != null && (i && i(p, C), g && g(p, C));
  });
  return /* @__PURE__ */ l.createElement(c, Z({}, u, {
    ref: t,
    onClick: x,
    className: cr(r, y && "active")
  }));
});
Vp.defaultProps = LT;
var CT = ["bsPrefix", "className", "children", "as"], uc = /* @__PURE__ */ l.forwardRef(
  // Need to define the default "as" during prop destructuring to be compatible with styled-components github.com/react-bootstrap/react-bootstrap/issues/3595
  function(e, t) {
    var n = e.bsPrefix, r = e.className, a = e.children, i = e.as, s = i === void 0 ? "div" : i, c = vn(e, CT);
    return n = va(n, "nav-item"), /* @__PURE__ */ l.createElement(s, Z({}, c, {
      ref: t,
      className: cr(r, n)
    }), a);
  }
);
uc.displayName = "NavItem";
var ST = ["bsPrefix", "disabled", "className", "href", "eventKey", "onSelect", "as"], TT = {
  disabled: !1,
  as: sc
}, No = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n = e.bsPrefix, r = e.disabled, a = e.className, i = e.href, s = e.eventKey, c = e.onSelect, u = e.as, p = vn(e, ST);
  return n = va(n, "nav-link"), /* @__PURE__ */ l.createElement(Vp, Z({}, p, {
    href: i,
    ref: t,
    eventKey: s,
    as: u,
    disabled: r,
    onSelect: c,
    className: cr(a, n, r && "disabled")
  }));
});
No.displayName = "NavLink";
No.defaultProps = TT;
var DT = ["as", "bsPrefix", "variant", "fill", "justify", "navbar", "navbarScroll", "className", "children", "activeKey"], kT = {
  justify: !1,
  fill: !1
}, Qa = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n, r = ac(e, {
    activeKey: "onSelect"
  }), a = r.as, i = a === void 0 ? "div" : a, s = r.bsPrefix, c = r.variant, u = r.fill, p = r.justify, g = r.navbar, v = r.navbarScroll, y = r.className, E = r.children, L = r.activeKey, x = vn(r, DT), C = va(s, "nav"), T, D, k = !1, N = Un(jp), R = Un(_p);
  return N ? (T = N.bsPrefix, k = g ?? !0) : R && (D = R.cardHeaderBsPrefix), /* @__PURE__ */ l.createElement(xT, Z({
    as: i,
    ref: t,
    activeKey: L,
    className: cr(y, (n = {}, n[C] = !k, n[T + "-nav"] = k, n[T + "-nav-scroll"] = k && v, n[D + "-" + c] = !!D, n[C + "-" + c] = !!c, n[C + "-fill"] = u, n[C + "-justified"] = p, n))
  }, x), E);
});
Qa.displayName = "Nav";
Qa.defaultProps = kT;
Qa.Item = uc;
Qa.Link = No;
var Up = function(t) {
  var n = ac(t, {
    activeKey: "onSelect"
  }), r = n.id, a = n.generateChildId, i = n.onSelect, s = n.activeKey, c = n.transition, u = n.mountOnEnter, p = n.unmountOnExit, g = n.children, v = rn(function() {
    return a || function(E, L) {
      return r ? r + "-" + L + "-" + E : null;
    };
  }, [r, a]), y = rn(function() {
    return {
      onSelect: i,
      activeKey: s,
      transition: c,
      mountOnEnter: u || !1,
      unmountOnExit: p || !1,
      getControlledId: function(L) {
        return v(L, "tabpane");
      },
      getControllerId: function(L) {
        return v(L, "tab");
      }
    };
  }, [i, s, c, u, p, v]);
  return /* @__PURE__ */ l.createElement(Po.Provider, {
    value: y
  }, /* @__PURE__ */ l.createElement(za.Provider, {
    value: i || null
  }, g));
}, PT = ["bsPrefix", "as", "className"], Bp = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n = e.bsPrefix, r = e.as, a = r === void 0 ? "div" : r, i = e.className, s = vn(e, PT), c = va(n, "tab-content");
  return /* @__PURE__ */ l.createElement(a, Z({
    ref: t
  }, s, {
    className: cr(i, c)
  }));
}), NT = ["activeKey", "getControlledId", "getControllerId"], RT = ["bsPrefix", "className", "active", "onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "mountOnEnter", "unmountOnExit", "transition", "as", "eventKey"];
function IT(e) {
  var t = Un(Po);
  if (!t) return e;
  var n = t.activeKey, r = t.getControlledId, a = t.getControllerId, i = vn(t, NT), s = e.transition !== !1 && i.transition !== !1, c = Qi(e.eventKey);
  return Z({}, e, {
    active: e.active == null && c != null ? Qi(n) === c : e.active,
    id: r(e.eventKey),
    "aria-labelledby": a(e.eventKey),
    transition: s && (e.transition || i.transition || oc),
    mountOnEnter: e.mountOnEnter != null ? e.mountOnEnter : i.mountOnEnter,
    unmountOnExit: e.unmountOnExit != null ? e.unmountOnExit : i.unmountOnExit
  });
}
var dc = /* @__PURE__ */ l.forwardRef(function(e, t) {
  var n = IT(e), r = n.bsPrefix, a = n.className, i = n.active, s = n.onEnter, c = n.onEntering, u = n.onEntered, p = n.onExit, g = n.onExiting, v = n.onExited, y = n.mountOnEnter, E = n.unmountOnExit, L = n.transition, x = n.as, C = x === void 0 ? "div" : x;
  n.eventKey;
  var T = vn(n, RT), D = va(r, "tab-pane");
  if (!i && !L && E) return null;
  var k = /* @__PURE__ */ l.createElement(C, Z({}, T, {
    ref: t,
    role: "tabpanel",
    "aria-hidden": !i,
    className: cr(a, D, {
      active: i
    })
  }));
  return L && (k = /* @__PURE__ */ l.createElement(L, {
    in: i,
    onEnter: s,
    onEntering: c,
    onEntered: u,
    onExit: p,
    onExiting: g,
    onExited: v,
    mountOnEnter: y,
    unmountOnExit: E
  }, k)), /* @__PURE__ */ l.createElement(Po.Provider, {
    value: null
  }, /* @__PURE__ */ l.createElement(za.Provider, {
    value: null
  }, k));
});
dc.displayName = "TabPane";
var Xa = /* @__PURE__ */ function(e) {
  xo(t, e);
  function t() {
    return e.apply(this, arguments) || this;
  }
  var n = t.prototype;
  return n.render = function() {
    throw new Error("ReactBootstrap: The `Tab` component is not meant to be rendered! It's an abstract component that is only valid as a direct Child of the `Tabs` Component. For custom tabs components use TabPane and TabsContainer directly");
  }, t;
}(l.Component);
Xa.Container = Up;
Xa.Content = Bp;
Xa.Pane = dc;
var AT = ["id", "onSelect", "transition", "mountOnEnter", "unmountOnExit", "children", "activeKey"], OT = {
  variant: "tabs",
  mountOnEnter: !1,
  unmountOnExit: !1
};
function MT(e) {
  var t;
  return pT(e, function(n) {
    t == null && (t = n.props.eventKey);
  }), t;
}
function $T(e) {
  var t = e.props, n = t.title, r = t.eventKey, a = t.disabled, i = t.tabClassName, s = t.id;
  return n == null ? null : /* @__PURE__ */ l.createElement(uc, {
    as: No,
    eventKey: r,
    disabled: a,
    id: s,
    className: i
  }, n);
}
var Ro = function(t) {
  var n = ac(t, {
    activeKey: "onSelect"
  }), r = n.id, a = n.onSelect, i = n.transition, s = n.mountOnEnter, c = n.unmountOnExit, u = n.children, p = n.activeKey, g = p === void 0 ? MT(u) : p, v = vn(n, AT);
  return /* @__PURE__ */ l.createElement(Up, {
    id: r,
    activeKey: g,
    onSelect: a,
    transition: i,
    mountOnEnter: s,
    unmountOnExit: c
  }, /* @__PURE__ */ l.createElement(Qa, Z({}, v, {
    role: "tablist",
    as: "nav"
  }), nd(u, $T)), /* @__PURE__ */ l.createElement(Bp, null, nd(u, function(y) {
    var E = Z({}, y.props);
    return delete E.title, delete E.disabled, delete E.tabClassName, /* @__PURE__ */ l.createElement(dc, E);
  })));
};
Ro.defaultProps = OT;
Ro.displayName = "Tabs";
const Hp = ({
  selectedItem: e,
  relatedContent: t,
  viewSelectedContent: n = window.openDocumentViewer,
  isViewingRelatedSection: r,
  yearsCategoriesList: a
}) => {
  const i = async (s) => {
    var L, x, C, T, D, k, N;
    const c = await F.generateStructuredContentUrlAndFetchData("articleId", s), u = (L = F.getValuesFromJson(c, "contentType")) == null ? void 0 : L.data, g = ((x = F.getValuesFromJson(c, "selectType")) == null ? void 0 : x.data) || u, v = (C = F.getValuesFromJson(c, "formPDF").document) != null && C.contentUrl ? (T = F.getValuesFromJson(c, "formPDF").document) == null ? void 0 : T.contentUrl : "", y = (k = (D = F.getValuesFromJson(c, "reportFile")) == null ? void 0 : D.document) != null && k.contentUrl ? (N = F.getValuesFromJson(c, "reportFile").document) == null ? void 0 : N.contentUrl : "", E = F.getValuesFromJson(c, "URLLink").link ? F.getValuesFromJson(c, "URLLink").link : "";
    if (g == "PDF" && y) {
      window.open(y, "_blank");
      return;
    } else if (v) {
      window.open(F.removeUrlAttribute(v, "download"), "_blank");
      return;
    } else if (E) {
      window.open(E, "_blank");
      return;
    } else if (y) {
      window.open(F.removeUrlAttribute(y, "download"), "_blank");
      return;
    }
    n("others", "articleId", s, {}, !!r);
  };
  return e ? /* @__PURE__ */ l.createElement(l.Fragment, null, t && (t == null ? void 0 : t.map((s, c) => {
    var u;
    return /* @__PURE__ */ l.createElement(
      sr,
      {
        key: s.id,
        title: `${s.name} - (${s.docCount})`,
        isAccordion: !0,
        isAccordionOpen: !1,
        isPopup: !0
      },
      /* @__PURE__ */ l.createElement("div", { className: "recent-opened-items", role: "list", "aria-label": `${'List\x20with'} ${(u = s.relatedContents) == null ? void 0 : u.length} ${'items'}` }, (() => {
        var v;
        console.log("RelatedAssetsAccordion item:", s);
        const p = s.relatedContents || [], g = (v = s.taxonomyCategoryProperties) == null ? void 0 : v.some((y) => y.key === "appendYearInTitle" && y.value === "true");
        return g && p.sort((y, E) => {
          let L = F.getTaggedCategory(a, y.taxonomyCategoryBriefs);
          L = (L == null ? void 0 : L.label) || (L == null ? void 0 : L.name);
          let x = F.getTaggedCategory(a, E.taxonomyCategoryBriefs);
          x = (x == null ? void 0 : x.label) || (x == null ? void 0 : x.name);
          const C = (x || "").localeCompare(L || "");
          return C !== 0 ? C : y.title.localeCompare(E.title);
        }), p.map((y, E) => {
          var T;
          const L = `${y.title}, ${E + 1} ${'of'} ${(T = s.relatedContents) == null ? void 0 : T.length}`;
          let x = F.getTaggedCategory(a, y.taxonomyCategoryBriefs);
          x = (x == null ? void 0 : x.label) || (x == null ? void 0 : x.name);
          const C = g && x ? `${y.title} (${x})` : y.title;
          return y.contentType == "StructuredContent" ? /* @__PURE__ */ l.createElement(
            "button",
            {
              key: E,
              type: "button",
              className: "recent-opened-item text-truncate",
              onClick: () => i(y.entryClassPK),
              "data-ArticleId": y.entryClassPK,
              title: y.title,
              "aria-label": L
            },
            /* @__PURE__ */ l.createElement("span", { title: y.title, "aria-hidden": "true" }, C)
          ) : y.contentType == "Document" ? /* @__PURE__ */ l.createElement(
            "button",
            {
              key: E,
              type: "button",
              className: "recent-opened-item text-truncate",
              onClick: () => F.openSelectedDocument(y.entryClassPK),
              "data-documentId": y.entryClassPK,
              "aria-label": L
            },
            /* @__PURE__ */ l.createElement("span", { title: y.title, "aria-hidden": "true" }, C)
          ) : /* @__PURE__ */ l.createElement(l.Fragment, null);
        });
      })())
    );
  }))) : /* @__PURE__ */ l.createElement(nc, null);
}, FT = ({
  compareContextSection: e,
  actTitle: t,
  viewSelectedContent: n = window.openDocumentViewer,
  compareSectionCache: r,
  compareActCache: a
}) => {
  const [i, s] = V(e), [c, u] = V(null), p = vt(async (y) => {
    var x, C;
    if (!y) return {};
    if (r.current.has(y))
      return r.current.get(y);
    const E = F.createSearchBody(
      { cms_id: String(y) },
      { emptySearch: !0, erc: "ARTICLE_BY_CMS_ID_BP_ERC" }
    ), L = {
      nestedFields: "embedded",
      fields: "embedded.id,id,itemURL,title",
      page: 1,
      pageSize: 1
    };
    try {
      const D = (x = (await Ve.getSearchResults(E, L)).items) == null ? void 0 : x[0];
      if (!D) return {};
      const k = {
        entityName: "Sections",
        sectionId: ((C = D.embedded) == null ? void 0 : C.id) ?? D.id,
        sectionUrl: D.itemURL,
        sectionTitle: D.title
      };
      return r.current.set(y, k), k;
    } catch {
      return {};
    }
  }, []), g = rn(() => {
    var E, L;
    return ((E = F.getValuesFromJson(i == null ? void 0 : i.embedded, "sectionCMSID")) == null ? void 0 : E.data) || ((L = i == null ? void 0 : i.embedded) == null ? void 0 : L.title) || "";
  }, [i]);
  ye(() => {
    u(null), i && (async () => {
      var D;
      const y = {
        sort: t === "Income-tax Act, 1961" || t === "आय-कर अधिनियम, 1961" || t === "आयकर नियम, 1962" || t === "Income-tax Rules" ? "parentSectionPriority:asc" : "childSectionPriority:asc",
        restrictFields: "actions,creator,dateCreated,dateModified,externalReferenceCode,status",
        page: 1,
        pageSize: -1
      }, E = (D = F.getValuesFromJson(i.embedded, "sectionCMSID")) == null ? void 0 : D.data;
      if (a.current.has(E)) {
        u(a.current.get(E));
        return;
      }
      if (E)
        y.filter = `${t === "Income-tax Act, 1961" || t === "आय-कर अधिनियम, 1961" || t === "आयकर नियम, 1962" || t === "Income-tax Rules" ? "childSectionCmsId" : "parentSectionCmsId"} eq '${E}'`;
      else if (i.embedded.title)
        y.filter = `${t === "Income-tax Act, 1961" || t === "आय-कर अधिनियम, 1961" || t === "आयकर नियम, 1962" || t === "Income-tax Rules" ? "childSectionTitle" : "parentSectionTitle"} eq '${i.embedded.title}'`;
      else
        return;
      const L = await Ve.getObjectData("/o/c/incometaxactcompares/", y), x = t === "Income-tax Act, 1961" || t === "आय-कर अधिनियम, 1961" || t === "आयकर नियम, 1962" || t === "Income-tax Rules" ? "parentSectionPriority" : "childSectionPriority", C = /* @__PURE__ */ new Map();
      for (const k of L.items) {
        const N = t === "Income-tax Act, 1961" || t === "आय-कर अधिनियम, 1961" || t === "आयकर नियम, 1962" || t === "Income-tax Rules" ? k.parentSectionTitle : k.childSectionTitle, R = t === "Income-tax Act, 1961" || t === "आय-कर अधिनियम, 1961" || t === "आयकर नियम, 1962" || t === "Income-tax Rules" ? Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? k.parentSectionCmsId_i18n.en_US : k.parentSectionCmsId_i18n.hi_IN : Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? k.childSectionCmsId_i18n.en_US : k.childSectionCmsId_i18n.hi_IN, A = t === "Income-tax Act, 1961" || t === "आय-कर अधिनियम, 1961" || t === "आयकर नियम, 1962" || t === "Income-tax Rules" ? Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? k.parentDataValidity_i18n.en_US : k.parentDataValidity_i18n.hi_IN : Liferay.ThemeDisplay.getBCP47LanguageId() == "en-US" ? k.childDataValidity_i18n.en_US : k.childDataValidity_i18n.hi_IN;
        if (!N || !R || A == "INVALID") continue;
        const f = k[x] ?? Number.MAX_SAFE_INTEGER, _ = C.get(R);
        (!_ || f < (_[x] ?? Number.MAX_SAFE_INTEGER)) && C.set(R, k);
      }
      const T = [];
      for (const [k, N] of C.entries()) {
        const R = await p(k);
        R.sectionTitle && T.push({
          title: R.sectionTitle,
          id: N.id,
          cmsId: k
        });
      }
      a.current.set(E, T), u(T);
    })();
  }, [g, t, p]);
  const v = async (y) => {
    var x, C, T, D, k, N, R;
    const E = await p(y), L = E == null ? void 0 : E.sectionId;
    if (L) {
      const A = await F.generateStructuredContentUrlAndFetchData("articleId", L), f = (x = F.getValuesFromJson(A, "contentType")) == null ? void 0 : x.data, O = ((C = F.getValuesFromJson(A, "selectType")) == null ? void 0 : C.data) || f, J = (T = F.getValuesFromJson(A, "formPDF").document) != null && T.contentUrl ? (D = F.getValuesFromJson(A, "formPDF").document) == null ? void 0 : D.contentUrl : "", ee = (N = (k = F.getValuesFromJson(A, "reportFile")) == null ? void 0 : k.document) != null && N.contentUrl ? (R = F.getValuesFromJson(A, "reportFile").document) == null ? void 0 : R.contentUrl : "", ge = F.getValuesFromJson(A, "URLLink").link ? F.getValuesFromJson(A, "URLLink").link : "";
      if (O == "PDF" && ee) {
        window.open(ee == null ? void 0 : ee.contentUrl, "_blank");
        return;
      } else if (J) {
        window.open(F.removeUrlAttribute(J, "download"), "_blank");
        return;
      } else if (ge) {
        window.open(ge, "_blank");
        return;
      } else if (ee) {
        window.open(F.removeUrlAttribute(ee, "download"), "_blank");
        return;
      }
      n("others", "articleId", L);
    }
  };
  return c ? /* @__PURE__ */ l.createElement(l.Fragment, null, c && (c.length > 0 ? c == null ? void 0 : c.map((y, E) => /* @__PURE__ */ l.createElement("div", { className: "recent-opened-items", role: "list", "aria-label": `${'List\x20with'} ${c == null ? void 0 : c.length} ${'items'}` }, /* @__PURE__ */ l.createElement(
    "button",
    {
      key: E,
      type: "button",
      className: "recent-opened-item text-truncate",
      onClick: () => v(y.cmsId),
      "data-ArticleId": y.cmsId,
      "aria-label": `${y.title}, ${E + 1} ${'of'} ${c == null ? void 0 : c.length}`
    },
    /* @__PURE__ */ l.createElement("span", { title: y.title, "aria-hidden": "true" }, y.title)
  ))) : /* @__PURE__ */ l.createElement("div", null, 'Mapping\x20Not\x20Available'))) : /* @__PURE__ */ l.createElement(nc, null);
}, BD = ({
  parallelReaderStructures: e = "",
  kmsDefaultRedirection: t = "",
  plid: n = "",
  ccdgaDefaultRedirection: r = "",
  ccdgaPlid: a = "",
  kmsGroupId: i = "",
  kmsURL: s,
  ccdgaURL: c
}) => {
  const { observer: u, onClose: p } = Br({
    onClose: () => Io()
  }), g = 5, v = {
    CMSID: "CMSID",
    ARTICLE_KEY: "articleKey",
    ARTICLE_ID: "articleId",
    ITEM_URL: "itemUrl",
    FRIENDLY_URL: "friendlyUrl",
    FRIENDLY_URL_PATH: "friendlyUrlPath",
    ARTICLE_FRIENDLY_URL: "articleFriendlyUrl"
  }, y = {
    Sections: "Sections",
    Rules: "Rules",
    DTAA: "DTAA"
  }, E = _e(/* @__PURE__ */ new Map()), L = _e(/* @__PURE__ */ new Map()), [x, C] = V(e.split(",").map((q) => q.trim()).filter(Boolean)), [T, D] = V(!1), [k, N] = V(!1), [R, A] = V(null), [f, _] = V(!1), [O, J] = V({}), [ee, ge] = V([]), [ie, fe] = V(null), [be, $e] = V(""), [Se, xe] = V(0), [Te, We] = V(0), [Oe, Ne] = V([]), [Me, Ze] = V(!1), [at, He] = V(!1), [nt, yt] = V(!1), Ct = _e(null), rt = _e(null), mt = _e(null), dt = _e(null), Ie = _e(null), [Ue, Xe] = V(!1), [ae, oe] = V(/* @__PURE__ */ new Map()), [we, De] = V(null), [ue, ne] = V(null), [he, et] = V(null), [se, G] = V(null), [Re, bt] = V(null), [St, an] = V(!1), [ct, yn] = V(), [un, Ot] = V(localStorage.getItem("recentlyOpenedTabs") != null ? new Map(JSON.parse(localStorage.getItem("recentlyOpenedTabs"))) : /* @__PURE__ */ new Map()), [Ht, dn] = V(/* @__PURE__ */ new Map()), [Dn, Qt] = V([]), kn = _e(/* @__PURE__ */ new Map());
  _e(/* @__PURE__ */ new Map());
  const [Rn, dr] = V([]), [En, Xt] = V([]), [zt, fr] = V(null), [te, de] = V(!1), [Fe, Be] = V(!1), [Tt, Ge] = V(!1), ot = _e([]), Nt = _e(null), [bn, fn] = V(Date.now()), Zt = Liferay.ThemeDisplay.getPortalURL() + Liferay.currentURL, qr = new URL(Zt).searchParams, gt = {};
  qr.forEach((q, U) => {
    gt[U] = q || "";
  });
  const [In, ya] = V(null);
  ye(() => {
    let q = !0;
    if (N(!1), !R || !zt || !we) {
      ya(null);
      return;
    }
    return (async () => {
      try {
        const U = await F.getActCompareContext(
          R,
          zt
        );
        q && ya(U);
      } catch (U) {
        console.error(U), q && ya(null);
      }
    })(), () => {
      q = !1;
    };
  }, [R, zt]), ye(() => {
    In != null && In.shouldShowCompare ? D(!0) : D(!1);
  }, [In == null ? void 0 : In.shouldShowCompare]);
  const Io = () => {
    _(!1), De(), et(), ne(), G(), bt(), oe(/* @__PURE__ */ new Map()), J({}), xe(0), dr([]), Xt([]);
    const q = 'Document\x20Viewer\x20closed\x2c\x20returning\x20to\x20main\x20content\x2e';
    F.announceScreenReaderMessage(q), yn({});
  }, Za = async (q) => {
    let U = q.relatedDueDates;
    U || (U = await Ci.fetchRelatedDueDates("articleId", q.id), q.relatedDueDates = U), dr(U);
  }, Ao = async (q) => {
    console.debug("Fetching Relevant Rules for the Article: " + q.id);
    let U = q.relatedRules;
    console.debug("Related Rules from Article Data: ", U), U || (console.debug("No Related Rules found in Article Data, fetching from API"), U = await Ve.fetchRelatedRules(q.id, q), q.relatedRules = U, console.debug("Related Rules fetched from API: ", U)), Xt(U);
  }, Fn = (q, U) => {
    var me, ve;
    et(), ne(), U || (U = (me = ae.get(q.toString())) == null ? void 0 : me.articleData);
    try {
      Xe(x.includes(String(U.contentStructureId))), A({ embedded: U }), U.relatedContentsMap = new Map((ve = U == null ? void 0 : U.relatedContents) == null ? void 0 : ve.map((Pe) => [String(Pe.id), Pe])), $e(U == null ? void 0 : U.title), Ne(U), fe(F.getValuesFromJson(U, "documentContent"));
      const Ye = q.toString();
      De(Ye), G(U.id), bt(U), ot.current = [Ye, ...ot.current.filter((Pe) => Pe !== Ye)], Za(U), Ao(U);
    } catch (Ye) {
      console.debug(Ye);
    }
  }, ei = async (q, U, me, ve) => {
    if (console.debug("Current Clicked Div(ShowMainContent): " + window.currentSourceDivId), window.currentSourceDivId && window.currentSourceDivId == "related-assets-viewer") {
      window.viewSelectedRelatedAsset(q, U, me);
      return;
    }
    if (window.currentSourceDivId && String(window.currentSourceDivId).startsWith("viewer-", 0)) {
      window.updateParallelViewerContent(q, U, me, ve);
      return;
    }
    window.openDocumentViewer(q, U, me);
  }, ba = (q = []) => {
    window.currentSourceDivId = null, yn(q), J(q), q.entityName == y.DTAA && q.documetnViewerNavigationContext && yn(q.documetnViewerNavigationContext);
  }, wa = async (q, U, me, ve, Ye, Pe) => {
    var Ln, Pr, Ta, Nr;
    Ye && (ve.isRelatedContentOpen = !0);
    let Ce;
    U == "friendlyUrl" ? Ce = await xa(me) : U == "CMSID" ? Ce = await ti(me) : Ce = await F.generateStructuredContentUrlAndFetchData(U, me);
    const ft = Array.isArray(Ce == null ? void 0 : Ce.items) ? ((Ln = Ce.items[0]) == null ? void 0 : Ln.embedded) || Ce.items[0] : (Ce == null ? void 0 : Ce.embedded) || Ce;
    if (!ft)
      return;
    const _t = (Pr = F.getValuesFromJson(ft, "contentType")) == null ? void 0 : Pr.data;
    if ((((Ta = F.getValuesFromJson(ft, "selectType")) == null ? void 0 : Ta.data) || _t) == "PDF") {
      const Bn = (Nr = F.getValuesFromJson(ft, "reportFile")) == null ? void 0 : Nr.document;
      window.open(Bn == null ? void 0 : Bn.contentUrl, "_blank");
      return;
    }
    let wn = "";
    const qt = U == null ? void 0 : U.toLowerCase();
    if (qt == v.CMSID.toLowerCase())
      wn = me;
    else if (qt == v.ARTICLE_KEY.toLowerCase())
      wn = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/structured-contents/by-key/${me}`;
    else if (qt == v.ARTICLE_ID.toLowerCase())
      wn = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/structured-contents/${me}`;
    else if (qt == v.ITEM_URL.toLowerCase() || qt == v.FRIENDLY_URL.toLowerCase() || qt == v.FRIENDLY_URL_PATH.toLowerCase())
      wn = me;
    else if (qt == v.ARTICLE_FRIENDLY_URL.toLowerCase()) {
      const Bn = {
        filter: "friendlyUrlPath eq '" + me + "'",
        pageSize: 1,
        restrictFields: "actions"
      }, ar = F.createQueryString(Bn);
      wn = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/structured-contents?${ar}`, console.debug("Generated Friendly URL Path: " + wn);
    } else {
      console.warn("Please select a valid field name");
      return;
    }
    an(U), ne(wn), et(me), ve || (ve = {
      entityName: q
    }), y[q] && ve.enableParallelReading == null && (ve.enableParallelReading = !0), J(ve), window.currentSourceDivId = null, Pe && fn(Pe);
  }, Wr = async () => {
    try {
      return _n(), await Liferay.Util.fetch(
        ue,
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      );
    } catch (q) {
      console.debug(q);
    } finally {
      rr();
    }
  }, xa = async (q = he) => {
    try {
      _n();
      let me = F.createSearchBody(
        {
          friendly_url: q
        },
        {
          emptySearch: !0,
          erc: "ARTICLE_BY_FRIENDLY_URL_BP_ERC"
        }
      );
      const ve = {
        nestedFields: "embedded",
        page: 1,
        pageSize: 1
      };
      return await Ve.getSearchResults(me, ve);
    } catch (U) {
      console.debug(U);
    } finally {
      rr();
    }
  }, ti = async (q = he) => {
    try {
      _n();
      let me = F.createSearchBody(
        {
          cms_id: q
        },
        {
          emptySearch: !0,
          erc: "ARTICLE_BY_CMS_ID_BP_ERC"
        }
      );
      const ve = {
        nestedFields: "embedded",
        page: 1,
        pageSize: 1
      };
      return await Ve.getSearchResults(me, ve);
    } catch (U) {
      console.debug(U);
    } finally {
      rr();
    }
  }, kr = async () => {
    var q, U, me, ve, Ye;
    if (Yr(he)) {
      console.debug("Existing Tab Activated");
      return;
    }
    console.debug("Requested Article ID is not available, data will be fetched");
    try {
      let Pe;
      St == "friendlyUrl" ? Pe = await xa() : St == "CMSID" ? Pe = await ti() : Pe = await (await Wr()).json();
      const Ce = Array.isArray(Pe == null ? void 0 : Pe.items) ? ((q = Pe.items[0]) == null ? void 0 : q.embedded) || Pe.items[0] : (Pe == null ? void 0 : Pe.embedded) || Pe;
      if (!Ce || Ce.status == "NOT_FOUND") {
        console.warn("No data Found for the given Article Details");
        return;
      }
      if (!F.getValuesFromJson(Ce, "documentContent").data) {
        console.warn("No Docment Content Found to display"), window.open(`/w/${Ce == null ? void 0 : Ce.friendlyUrlPath}`, "_blank");
        return;
      }
      if (console.debug("friendlyUrlPath", (U = Ce == null ? void 0 : Ce.embedded) == null ? void 0 : U.friendlyUrlPath), (St == "friendlyUrl" || St == "friendlyUrlPath") && ((me = Ce == null ? void 0 : Ce.embedded) != null && me.friendlyUrlPath) && ue != ((ve = Ce == null ? void 0 : Ce.embedded) == null ? void 0 : ve.friendlyUrlPath)) {
        console.warn(
          ue,
          ": friendlyUrlPath is not matching with found : ",
          (Ye = Ce == null ? void 0 : Ce.embedded) == null ? void 0 : Ye.friendlyUrlPath
        );
        return;
      }
      Gr(Ce.id, Ce), _(!0);
    } catch (Pe) {
      console.error("Error fetching section Content:", Pe);
    }
  }, Yr = (q) => ae.has(q) ? (console.debug("Active the Existing tab"), Fn(q), Nt.current = q, !0) : !1, Gr = (q, U) => {
    var ve;
    const me = {
      id: q,
      articleData: U,
      sectionContent: (ve = F.getValuesFromJson(U, "documentContent")) == null ? void 0 : ve.data
    };
    Xe(x.includes(String(U.contentStructureId))), Fn(q, U), Nt.current = q, A({ embedded: U }), oe((Ye) => {
      const Pe = new Map(Ye);
      if (!Pe.has(q) && Pe.size >= g) {
        const Ce = Pe.keys().next().value;
        Pe.delete(Ce);
      }
      return Pe.set(String(q), me), Pe;
    }), Ot((Ye) => {
      var ft, _t;
      const Pe = new Map(Ye);
      if (!Pe.has(q) && Pe.size >= g) {
        const en = Pe.keys().next().value;
        Pe.delete(en);
      }
      const Ce = {
        ...me,
        articleData: {
          id: (ft = me.articleData) == null ? void 0 : ft.id,
          title: (_t = me.articleData) == null ? void 0 : _t.title
          //contentFields: newTab.articleData?.contentFields
        }
      };
      return delete Ce.sectionContent, Pe.set(q, Ce), localStorage.setItem("recentlyOpenedTabs", JSON.stringify(Array.from(Pe.entries()))), Pe;
    });
  }, Ea = (q, U, me, ve) => {
    const {
      entityName: Ye,
      selectedAct: Pe,
      selectedYear: Ce,
      parallelViewWindowCount: ft = 2
    } = O || {}, _t = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/structured-contents/${q}`, en = [], jt = {};
    jt.entityName = Ye, jt.actId = Pe, jt.yearId = Ce, jt.sectionId = q, jt.sectionUrl = _t, jt.articleData = U, jt.dtaaViewType = O.dtaaViewType, jt.countriesList = O.countriesList, jt.dtaaTypeList = O.dtaaTypeList, jt.articleNumbersList = O.articleNumbersList, jt.subjectsList = O.subjectsList, en.push(jt);
    const wn = me ? `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/structured-contents/${me}` : null, qt = Array.from({ length: ft - 1 }, () => ({
      entityName: Ye,
      actId: Pe,
      yearId: Ce,
      sectionId: q,
      sectionUrl: wn,
      articleData: ve,
      dtaaViewType: O.dtaaViewType,
      countriesList: O.countriesList,
      dtaaTypeList: O.dtaaTypeList,
      articleNumbersList: O.articleNumbersList,
      subjectsList: O.subjectsList
    }));
    en.push(...qt), window.startParallelViewer(en), p();
  }, ni = (q, U) => {
    an(!1), ne(`${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/structured-contents/${q}`), et(q);
  }, Oo = () => {
    let q = 0;
    if (gt.isNewPage)
      q = Number(gt.currentPage);
    else {
      let U = O.documetnViewerNavigationContext.currentPage, me = Number(O.documetnViewerNavigationContext.index), ve = Number(O.documetnViewerNavigationContext.itemsPerPage);
      q = (U - 1) * ve + me + 1;
    }
    xe(q);
  };
  ye(() => {
    if (!ue || !he) {
      console.warn("No Article Id/URL found");
      return;
    }
    de(!1), kr();
  }, [he, bn]), ye(() => {
    if (Object.keys(O).length == 0)
      return;
    if (O.entityName == y.DTAA && O.documetnViewerNavigationContext) {
      Oo();
      return;
    }
    if ((ee == null ? void 0 : ee.length) == 0 && (O != null && O.yearsCategoriesList) && ge(O.yearsCategoriesList), f && !gt.currentPage && !O.currentPage)
      return;
    let q = 0;
    if (gt.isNewPage)
      q = Number(gt.currentPage);
    else {
      let U = O.currentPage, me = Number(O.sectionIndex), ve = Number(O.itemsPerPage);
      q = (U - 1) * ve + me + 1;
    }
    xe(q);
  }, [O]), ye(() => {
    window.startDocumentViewer = ba, window.openDocumentViewer = wa, window.ShowMainContent = ei, window.ShowFootnote2022 = Fo, window.ShowFootnote = Sa, window.showLoader = _n, window.hideLoader = rr;
  }, []), ye(() => {
    if (Object.keys(O).length != 0) {
      if (O.entityName == y.DTAA && O.documetnViewerNavigationContext) {
        Mo();
        return;
      }
      La();
    }
  }, [Se]), ye(() => {
    !Oe || Oe.length == 0 || (zt || (async () => {
      const q = await F.fetchRelatedContentCategories(["Act", "Rule"]);
      fr(q);
    })(), ri());
  }, [Oe]);
  const La = async () => {
    try {
      if (_n(), Se == 0) {
        console.warn("Current Page can't be 0");
        return;
      }
      if (!(gt != null && gt.isNewPage ? gt != null && gt.selectedAct : ct != null && ct.selectedAct)) {
        console.warn("Please select an Act to get the List of Sections");
        return;
      }
      const q = ct.searchType == "rule" || ct.searchType == "subject" ? F.createSearchBody(
        {
          rule_id: gt.isNewPage ? gt.selectedAct : ct.selectedAct,
          rule_number: gt.isNewPage ? gt.sectionChapterNumber : ct.sectionChapterNumber,
          free_text: gt.isNewPage ? gt.freeText : ct.freeText,
          subject_title: gt.isNewPage ? gt.chapterNumber : ct.chapterNumber
        },
        {
          emptySearch: !0,
          erc: "RULE_CONTENT_LIST_BP_ERC"
        }
      ) : F.createSearchBody(
        {
          act_id: gt.isNewPage ? gt.selectedAct : ct.selectedAct,
          year_id: gt.isNewPage ? gt.selectedYear : ct.selectedYear,
          chapter_section_number: gt.isNewPage ? gt.sectionChapterNumber : ct.sectionChapterNumber,
          free_text: gt.isNewPage ? gt.freeText : ct.freeText,
          chapter_number: gt.isNewPage ? gt.chapterNumber : ct.chapterNumber
        },
        {
          emptySearch: !0,
          erc: "ACT_SECTIONS_BP_ERC"
        }
      ), U = {
        nestedFields: "embedded",
        page: Se,
        pageSize: 1
      };
      await Ve.getSearchResults(q, U).then((me) => {
        var ft, _t;
        if (!me || !me.items.length) {
          console.warn("No data Found");
          return;
        }
        A(me.items[0]);
        const ve = (ft = F.getValuesFromJson(
          me.items[0],
          "documentContent"
        )) == null ? void 0 : ft.data, Ye = F.getValuesFromJson(me.items[0].embedded, "contentType").data;
        if ((F.getValuesFromJson(me.items[0].embedded, "selectType").data || Ye) === "PDF" || !ve) {
          const en = F.getValuesFromJson(me.items[0].embedded, "reportFile").document;
          if (en) {
            window.open(en == null ? void 0 : en.contentUrl, "_blank");
            return;
          }
        }
        if (!ve) {
          console.warn("No Docment Content Found to display"), window.open(`/w/${(_t = me.items[0].embedded) == null ? void 0 : _t.friendlyUrlPath}`, "_blank");
          return;
        }
        We(me.totalCount), _(!0), Yr(me.items[0].embedded.id) || Gr(me.items[0].embedded.id, me.items[0].embedded);
      });
    } catch (q) {
      console.debug(q);
    } finally {
      rr();
    }
  }, Mo = async () => {
    var q, U, me, ve, Ye;
    try {
      if (_n(), Se <= 0) {
        console.debug("Current Page can't be 0 or less");
        return;
      }
      if (!ct) {
        console.debug("Invalid Context details");
        return;
      }
      const { country: Pe, dtaa_type: Ce, article_number: ft, subject: _t, entry_year: en, signature_year: jt, search_text: wn } = ct;
      let qt;
      if (ft || _t ? (console.debug("Calling fetchArticlesAndSubjects API..."), qt = await nn.fetchArticlesAndSubjects(
        Pe,
        Ce,
        ft,
        _t,
        en,
        jt,
        wn,
        !1,
        Se,
        1
      )) : (console.debug("Calling fetchFullTreaties API..."), qt = await nn.fetchFullTreaties(
        Pe,
        Ce,
        en,
        jt,
        wn,
        !1,
        Se,
        1
      )), !qt || !qt.items || qt.items.length === 0) {
        console.warn("No data found for given criteria"), We(0), _(!1);
        return;
      }
      const Ln = qt.items[0], Pr = (q = F.getValuesFromJson(Ln.embedded, "contentType")) == null ? void 0 : q.data, Nr = ((U = F.getValuesFromJson(Ln.embedded, "selectType")) == null ? void 0 : U.data) || Pr, Bn = (me = F.getValuesFromJson(Ln.embedded, "documentContent")) == null ? void 0 : me.data;
      if (Nr == "PDF" || !Bn) {
        const ar = (ve = F.getValuesFromJson(Ln.embedded, "reportFile")) == null ? void 0 : ve.document;
        if (ar != null && ar.contentUrl) {
          console.debug("Opening PDF:", ar.contentUrl), window.open(ar.contentUrl, "_blank");
          return;
        }
      }
      if (!Bn) {
        console.warn("No Docment Content Found to display"), window.open(`/w/${(Ye = Ln.embedded) == null ? void 0 : Ye.friendlyUrlPath}`, "_blank");
        return;
      }
      We(qt.totalCount), _(!0), Yr(Ln.embedded.id) || Gr(Ln.embedded.id, Ln.embedded);
    } catch (Pe) {
      console.error("Error fetching DTAA data:", Pe);
    } finally {
      rr();
    }
  }, $o = (q) => {
    if (ae.size < 2) return;
    const U = String(q), me = new Map(ae);
    me.delete(U), ot.current = ot.current.filter((Ye) => Ye !== U);
    let ve = we;
    we === U && (ve = ot.current.find((Pe) => me.has(Pe)) ?? (me.size > 0 ? me.keys().next().value : null)), oe(me), ve && ve !== we && (Nt.current = ve, Fn(ve));
  };
  ye(() => {
    const q = Nt.current;
    if (!q) return;
    const U = document.getElementById(`tab-close-btn-${q}`);
    U && (requestAnimationFrame(() => U.focus()), Nt.current = null);
  }, [ae, we]);
  const ri = async () => {
    try {
      let q;
      if (Ht.size === 0 && (q = await F.fetchRelatedContentCategories(), dn(q)), (ee == null ? void 0 : ee.length) === 0) {
        const me = await Ve.getCategoriesByVocabularyName("Year");
        ge(me);
      }
      const U = await F.fetchRelatedContents(
        Oe,
        "",
        Ht.size === 0 ? q : Ht,
        kn.current
      );
      Qt(U);
    } catch (q) {
      console.error("Error fetching related assets:", q);
    }
  };
  function Ca() {
    return Te > 0 && Se > 0 ? /* @__PURE__ */ l.createElement("div", { className: "pagination" }, /* @__PURE__ */ l.createElement(
      "button",
      {
        onClick: () => xe(Se - 1),
        disabled: Se === 1 || Te == 0,
        className: "btn reset-btn-style prev-btn p-1",
        "aria-label": 'previous'
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-previous-arrow-sm" })
    ), /* @__PURE__ */ l.createElement("div", { class: "page-number-wrap" }, /* @__PURE__ */ l.createElement("span", { className: "current-page" }, Se), "/", /* @__PURE__ */ l.createElement("span", { className: "total-page" }, Te)), /* @__PURE__ */ l.createElement(
      "button",
      {
        onClick: () => xe(Se + 1),
        disabled: Se === Te || Te == 0,
        className: "btn reset-btn-style next-btn p-1",
        "aria-label": 'Next'
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-next-arrow-sm" })
    )) : null;
  }
  const Kr = (q, U) => /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", null, /* @__PURE__ */ l.createElement(
    "div",
    {
      dangerouslySetInnerHTML: {
        __html: q.replace(/<br\s*><\/br>/gi, "<br>") || ie.replace(/<br\s*><\/br>/gi, "<br>")
      }
    }
  ), U && /* @__PURE__ */ l.createElement(
    "div",
    {
      dangerouslySetInnerHTML: {
        __html: U
      }
    }
  ))), ai = () => {
    var q, U, me, ve;
    return /* @__PURE__ */ l.createElement("div", { className: "chapter-section-info" }, Oe && ((q = Oe.contentFields) == null ? void 0 : q.length) > 0 && /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", { className: "chapter-data" }, /* @__PURE__ */ l.createElement("p", { className: "chapter-number" }, 'Chapter' + " - " + ((U = F.getValuesFromJson(
      Oe,
      "chapterNumber"
    )) == null ? void 0 : U.data)), /* @__PURE__ */ l.createElement("p", { className: "chapter-title text-truncate text-uppercase" }, (me = F.getValuesFromJson(Oe, "chapterTitle")) == null ? void 0 : me.data)), /* @__PURE__ */ l.createElement("div", { className: "section-data" }, /* @__PURE__ */ l.createElement("p", { className: "section-number" }, be), /* @__PURE__ */ l.createElement("p", { className: "section-title text-truncate" }, (ve = F.getValuesFromJson(
      Oe,
      "sectionShortDescription"
    )) == null ? void 0 : ve.data))));
  }, pn = async (q) => {
    F.handleEmailAndRedirection({ article: q, kmsDefaultRedirection: t, kmsGroupId: i, plid: n, ccdgaDefaultRedirection: r, ccdgaPlid: a, emailRedirection: !1, kmsURL: s, ccdgaURL: c });
  }, pr = () => /* @__PURE__ */ l.createElement(
    Ro,
    {
      activeKey: we,
      onSelect: (q) => Fn(q),
      className: "doc-view-tabs"
    },
    Array.from(ae.entries()).map(([q, U]) => {
      var me;
      return /* @__PURE__ */ l.createElement(
        Xa,
        {
          eventKey: q,
          key: q,
          title: /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("span", { className: "tab-data-title", title: (me = U == null ? void 0 : U.articleData) == null ? void 0 : me.title }, F.getActRuleDocumentViewerTitle(U == null ? void 0 : U.articleData, zt).title), ae.size > 1 && /* @__PURE__ */ l.createElement(
            "button",
            {
              className: "btn reset-btn-style tab-close",
              onClick: (ve) => {
                ve.stopPropagation(), $o(q);
              },
              "aria-label": `${F.getActRuleDocumentViewerTitle(U == null ? void 0 : U.articleData, zt).title} ${'Close\x20Tab'}`,
              disabled: ae.size < 2,
              id: `tab-close-btn-${q}`
            },
            /* @__PURE__ */ l.createElement(re, { symbol: "etds-close" })
          ))
        },
        /* @__PURE__ */ l.createElement("div", { class: "doc-view-toolbar" }, /* @__PURE__ */ l.createElement("h2", { className: "document-title text-truncate mb-0", title: F.getActRuleDocumentViewerTitle(U == null ? void 0 : U.articleData, zt).title, "aria-label": `${F.getActRuleDocumentViewerTitle(U == null ? void 0 : U.articleData, zt).title}` }, F.getActRuleDocumentViewerTitle(U == null ? void 0 : U.articleData, zt).title), /* @__PURE__ */ l.createElement("div", { className: "actions-wrap" }, Ue && /* @__PURE__ */ l.createElement(
          "button",
          {
            className: "btn reset-btn-style btn-parallel-reading",
            onClick: (ve) => {
              var Ye;
              ve.stopPropagation(), Ea((Ye = U == null ? void 0 : U.articleData) == null ? void 0 : Ye.id, U == null ? void 0 : U.articleData);
            }
          },
          /* @__PURE__ */ l.createElement("span", { className: "btn-text" }, 'Parallel\x20Reading'),
          /* @__PURE__ */ l.createElement(re, { symbol: "etds-plus-square" })
        ), /* @__PURE__ */ l.createElement(
          "button",
          {
            className: "btn reset-btn-style btn-open-in-new-tab text-primary",
            onClick: (ve) => {
              ve.stopPropagation(), pn(U == null ? void 0 : U.articleData);
            },
            role: "link"
          },
          /* @__PURE__ */ l.createElement(re, { symbol: "etds-open-in-new-tab-lg" }),
          /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, F.getActRuleDocumentViewerTitle(U == null ? void 0 : U.articleData, zt).title, " ", 'Open\x20in\x20new\x20tab')
        ))),
        /* @__PURE__ */ l.createElement(
          "div",
          {
            ref: Ct,
            className: `doc-view-content-main ${at ? "print-with-footnote" : ""}`,
            id: `doc-key-${q}`,
            "aria-label": 'Section\x20Content'
          },
          (() => {
            var _t, en;
            const ve = (_t = F.getValuesFromJson(U == null ? void 0 : U.articleData, "documentContent")) == null ? void 0 : _t.data, Ye = (en = F.getValuesFromJson(U == null ? void 0 : U.articleData, "footnotes")) == null ? void 0 : en.data, Pe = (O == null ? void 0 : O.freeText) || "", Ce = F.highlightHtmlContent(ve, Pe), ft = Ye ? F.highlightHtmlContent(Ye, Pe) : null;
            return Kr(Ce, ft);
          })()
        )
      );
    })
  ), mr = (q, U, me) => {
    var Ye;
    const ve = (Ye = me.current) == null ? void 0 : Ye.querySelectorAll("button");
    if (!(!ve || ve.length === 0))
      if (q.key === "ArrowDown") {
        q.preventDefault();
        const Pe = (U + 1) % ve.length;
        ve[Pe].focus();
      } else if (q.key === "ArrowUp") {
        q.preventDefault();
        const Pe = (U - 1 + ve.length) % ve.length;
        ve[Pe].focus();
      } else q.key === "Escape" && (q.preventDefault(), Be(!1), de(!1), q.stopPropagation());
  };
  ye(() => {
    const q = (U) => {
      te && mt.current && !mt.current.contains(U.target) && de(!1);
    };
    return document.addEventListener("focusin", q), () => {
      document.removeEventListener("focusin", q);
    };
  }, [te]);
  function ii() {
    var q;
    (q = document.querySelector(".etds-section #footnoteSection")) == null || q.scrollIntoView({
      behavior: "smooth",
      block: "end",
      // or 'start', 'center', 'end', 'nearest'
      inline: "nearest"
    });
  }
  function Fo(q) {
    var me, ve, Ye;
    document.querySelector("#footnoteContent").innerHTML = document.querySelector("#" + q).closest("p").innerHTML;
    const U = 'Footnote\x20opened';
    if (F.announceScreenReaderMessage(U, "footnote-aria-live"), document.activeElementBeforeFootnote = document.activeElement, window.currentSourceDivId) {
      (me = document.querySelector("#" + currentSourceDivId + " #footnoteSection")) == null || me.classList.remove("d-none"), (ve = document.querySelector("#" + currentSourceDivId + " #footnoteSectionCloseButton")) == null || ve.focus();
      return;
    }
    document.querySelector("#footnoteSection").classList.remove("d-none"), (Ye = document.getElementById("footnoteSectionCloseButton")) == null || Ye.focus(), ii();
  }
  const Sa = (q) => {
    var me, ve;
    const U = 'Footnote\x20opened';
    if (F.announceScreenReaderMessage(U, "footnote-aria-live"), document.activeElementBeforeFootnote = document.activeElement, window.currentSourceDivId) {
      document.querySelector("#" + currentSourceDivId + " #footnoteContent").innerHTML = document.getElementById(q).innerHTML, document.querySelector("#" + currentSourceDivId + " #footnoteSection").classList.remove("d-none"), (me = document.querySelector("#" + currentSourceDivId + " #footnoteSectionCloseButton")) == null || me.focus();
      return;
    }
    document.querySelector("#document-viewer-wrapper #footnoteContent").innerHTML = document.getElementById(q).innerHTML, document.querySelector("#document-viewer-wrapper #footnoteSection").classList.remove("d-none"), (ve = document.getElementById("footnoteSectionCloseButton")) == null || ve.focus(), ii();
  };
  function oi() {
    return /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(
      hn,
      {
        observer: u,
        size: "xl",
        className: "document-viewer-modal"
      },
      /* @__PURE__ */ l.createElement("div", { "aria-live": "assertive", className: "sr-only", id: "documentViewer" }, 'Document\x20Viewer\x20Opened'),
      /* @__PURE__ */ l.createElement(hn.Body, { className: "p-0" }, Me && /* @__PURE__ */ l.createElement("div", { className: "loading-overlay" }, /* @__PURE__ */ l.createElement(nc, null)), /* @__PURE__ */ l.createElement("div", { className: "document-viewer-wrapper", id: "document-viewer-wrapper" }, /* @__PURE__ */ l.createElement("div", { className: "doc-view-sidebar" }, /* @__PURE__ */ l.createElement(To, { handleSidebarClick: F.handleDocumentViewerSidebarClick }), Ca(), /* @__PURE__ */ l.createElement(ko, null, (O == null ? void 0 : O.freeText) != "" && (O == null ? void 0 : O.freeText) != null && /* @__PURE__ */ l.createElement(
        sr,
        {
          title: 'Find',
          iconName: "etds-find-in-page",
          isAccordion: !0,
          isAccordionOpen: (O == null ? void 0 : O.freeText) != "" && (O == null ? void 0 : O.freeText) != null
        },
        /* @__PURE__ */ l.createElement("p", { className: "keyword-title" }, 'Keywords'),
        /* @__PURE__ */ l.createElement("div", { className: "keywords-box" }, (O == null ? void 0 : O.freeText) != "" && /* @__PURE__ */ l.createElement("span", { className: "keyword" }, O == null ? void 0 : O.freeText))
      ), /* @__PURE__ */ l.createElement(
        Do,
        {
          printWithFootnote: at,
          setPrintWithFootnote: He,
          docViewContentId: "doc-key-" + we,
          printFrameRef: rt
        }
      ), se && /* @__PURE__ */ l.createElement(Ip, { id: se, displayType: "sidebar" }), /* @__PURE__ */ l.createElement(
        Ap,
        {
          article: Re,
          kmsDefaultRedirection: t,
          kmsGroupId: i,
          plid: n,
          ccdgaDefaultRedirection: r,
          ccdgaPlid: a,
          kmsURL: s,
          ccdgaURL: c
        }
      ), En && En.length > 0 && /* @__PURE__ */ l.createElement(
        sr,
        {
          title: 'Related\x20Rules',
          iconName: "etds-list-view",
          isAccordion: !0,
          isPopup: !0,
          isAccordionOpen: Tt,
          handleDefOpen: Ge,
          defOpen: Tt
        },
        /* @__PURE__ */ l.createElement("div", { className: "recent-opened-items", ref: Ie }, Array.from(En.entries()).reverse().map(([q, U], me) => {
          var ve, Ye, Pe;
          return /* @__PURE__ */ l.createElement(
            "button",
            {
              role: "link",
              className: "recent-opened-item text-truncate",
              onClick: (Ce) => {
                var ft;
                Ce.stopPropagation(), Ea(Re == null ? void 0 : Re.id, Re, (ft = U == null ? void 0 : U.embedded) == null ? void 0 : ft.id, U == null ? void 0 : U.embedded);
              },
              "data-ArticleId": q,
              title: (ve = U == null ? void 0 : U.embedded) == null ? void 0 : ve.title,
              "aria-label": (Ye = U == null ? void 0 : U.embedded) == null ? void 0 : Ye.title,
              onKeyDown: (Ce) => mr(Ce, me, Ie)
            },
            (Pe = U == null ? void 0 : U.embedded) == null ? void 0 : Pe.title
          );
        }))
      ), Dn && Dn.length != 0 && /* @__PURE__ */ l.createElement(
        sr,
        {
          key: he + "relatedSidebar",
          title: 'Related\x20Content',
          iconName: "etds-list-view",
          isAccordion: !0,
          isAccordionOpen: (O == null ? void 0 : O.isRelatedContentOpen) || !1,
          isLockFocus: !1
        },
        /* @__PURE__ */ l.createElement(
          Hp,
          {
            selectedItem: Oe,
            relatedContent: Dn,
            isViewingRelatedSection: O == null ? void 0 : O.isRelatedContentOpen,
            yearsCategoriesList: ee
          }
        )
      ), /* @__PURE__ */ l.createElement(
        sr,
        {
          title: 'Recently\x20Opened\x20Tabs',
          iconName: "etds-history",
          isAccordion: !0,
          isPopup: !0,
          isAccordionOpen: te
        },
        /* @__PURE__ */ l.createElement("div", { className: "recent-opened-items", ref: mt }, Array.from(un.entries()).reverse().map(([q, U], me) => {
          var ve, Ye, Pe;
          return /* @__PURE__ */ l.createElement(
            "button",
            {
              key: q,
              role: "link",
              className: "recent-opened-item text-truncate",
              onClick: () => {
                const Ce = document.getElementById("documentViewer");
                Ce && (Ce.textContent = "", setTimeout(() => {
                  var _t;
                  const ft = 'Document\x20Viewer\x20Opened';
                  Ce.textContent = `${ft}: ${(_t = U == null ? void 0 : U.articleData) == null ? void 0 : _t.title}`;
                }, 50)), ni(q);
              },
              "data-ArticleId": q,
              title: (ve = U == null ? void 0 : U.articleData) == null ? void 0 : ve.title,
              "aria-label": (Ye = U == null ? void 0 : U.articleData) == null ? void 0 : Ye.title,
              onKeyDown: (Ce) => mr(Ce, me, mt)
            },
            (Pe = U == null ? void 0 : U.articleData) == null ? void 0 : Pe.title
          );
        }))
      ), Rn && Rn.length > 0 && /* @__PURE__ */ l.createElement(
        sr,
        {
          title: 'Due\x20Dates',
          iconName: "etds-doc-viewer-due-date",
          isAccordion: !0,
          isPopup: !0,
          isAccordionOpen: Fe,
          handleDefOpen: Be,
          defOpen: Fe,
          className: "doc-viewer-due-date"
        },
        /* @__PURE__ */ l.createElement("div", { className: "recent-opened-items", ref: dt }, Array.from(Rn.entries()).reverse().map(([q, U], me) => {
          var ve, Ye, Pe;
          return /* @__PURE__ */ l.createElement(
            "button",
            {
              role: "link",
              className: "recent-opened-item text-truncate",
              onClick: () => {
                var Ce, ft;
                return window.open(`/w/${(ft = (Ce = U == null ? void 0 : U.articleData) == null ? void 0 : Ce.embedded) == null ? void 0 : ft.friendlyUrlPath}`, "_blank");
              },
              "data-ArticleId": q,
              title: (ve = U == null ? void 0 : U.articleData) == null ? void 0 : ve.title,
              "aria-label": (Ye = U == null ? void 0 : U.articleData) == null ? void 0 : Ye.title,
              onKeyDown: (Ce) => mr(Ce, me, dt)
            },
            (Pe = U == null ? void 0 : U.articleData) == null ? void 0 : Pe.title
          );
        }))
      ), In && T && /* @__PURE__ */ l.createElement(
        sr,
        {
          title: In.title,
          iconName: "etds-income-tax-act-2025",
          isAccordion: !0,
          isPopup: !0,
          isAccordionOpen: k,
          className: "doc-viewer-act-compare doc-viewer-income-tax-act",
          handleDefOpen: N
        },
        /* @__PURE__ */ l.createElement(FT, { compareContextSection: R, actTitle: In.title, compareSectionCache: E, compareActCache: L })
      ))), /* @__PURE__ */ l.createElement("div", { className: "doc-view-section html-content-viewer" }, /* @__PURE__ */ l.createElement("span", { className: "sr-only", id: "footnote-aria-live", "aria-live": "assertive", "aria-atomic": "true" }), /* @__PURE__ */ l.createElement("div", { className: "doc-view-content-area" }, /* @__PURE__ */ l.createElement(
        "button",
        {
          className: "btn reset-btn-style close-doc-view-modal",
          onClick: p,
          "aria-label": 'Close\x20Popup'
        },
        /* @__PURE__ */ l.createElement(re, { symbol: "etds-close" })
      ), pr()), /* @__PURE__ */ l.createElement(rc, null)), /* @__PURE__ */ l.createElement("span", { tabIndex: "0", "aria-hidden": "true", onFocus: () => {
        var q;
        return (q = document.querySelector("#sidebar-modal-btn")) == null ? void 0 : q.focus();
      } })))
    ));
  }
  function _n() {
    const q = document.querySelector("#etds-preloader");
    q && (q.style.display = "block");
  }
  function rr() {
    const q = document.querySelector("#etds-preloader");
    q && (q.style.display = "none");
  }
  function _o() {
    return /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", null, ai(), Ca(), Kr()));
  }
  return /* @__PURE__ */ l.createElement(l.Fragment, null, f && (gt.isNewPage ? _o() : oi()));
}, HD = () => {
  const { observer: e, onClose: t } = Br({
    onClose: () => rt()
  }), n = { data: 'No\x20Preview\x20Available' }, r = 5, [a, i] = V(!1), [s, c] = V(), [u, p] = V(null), [g, v] = V(""), [y, E] = V(), [L, x] = V(!1), [C, T] = V(!1), D = _e(null), k = _e(null), [N, R] = V(/* @__PURE__ */ new Map()), [A, f] = V(null), [_, O] = V(null), [J, ee] = V(null), [ge, ie] = V(null), [fe, be] = V(null), [$e, Se] = V(/* @__PURE__ */ new Map()), [xe, Te] = V([]);
  _e(/* @__PURE__ */ new Map());
  const [We, Oe] = V(), Ne = _e([]), Me = (ae, oe, we, De) => {
    let ue = "";
    oe == "CMSID" ? ue = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}
        /structured-contents?page=1&pageSize=1&flatten=true&${"search=" + we}` : oe == "articleKey" ? ue = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}
        /structured-contents/by-key/${we}` : oe == "articleId" ? ue = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/structured-contents/${we}` : oe == "itemUrl" && (ue = we), Oe(De), c(ue);
  }, Ze = (ae) => {
    const we = ae.target.closest("div#related-assets-viewer");
    we && (window.currentSourceDivId = we.id, console.debug("Source Div ID captured:", window.currentSourceDivId));
  }, at = async () => {
    var ae, oe, we;
    if (!s) {
      console.debug("Please select a Article to view the Realted Assets of the selected Article");
      return;
    }
    try {
      const De = {
        fields: "relatedContents"
      }, ne = await (await Liferay.Util.fetch(
        s + "?" + F.createQueryString(De),
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      )).json(), he = ne != null && ne.items ? ne.items[0] : ne;
      if (!he || he.status == "NOT_FOUND") {
        console.warn("No data Found for the given Article Details");
        return;
      }
      if (!he.relatedContents || !he.relatedContents.length) {
        console.warn("No Related Assets Found to display");
        return;
      }
      console.log("Fetched Related Assets Data:"), console.log(he.relatedContents), he.relatedContentsMap = new Map((ae = he == null ? void 0 : he.relatedContents) == null ? void 0 : ae.map((Re) => [String(Re.id), Re]));
      const et = await Ie(he);
      if (!et || !et.length) {
        console.log("No valid Related Assets found to display");
        return;
      }
      let se = "", G = "";
      We ?? et.flatMap((Re) => Re.relatedContents).find((Re) => Re.contentType === "StructuredContent") ? (se = We ?? ((oe = et.flatMap((Re) => Re.relatedContents).find((Re) => Re.contentType === "StructuredContent")) == null ? void 0 : oe.entryClassPK), G = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/structured-contents/${se}`) : (se = We ?? ((we = et.flatMap((Re) => Re.relatedContents).find((Re) => Re.contentType === "Document")) == null ? void 0 : we.entryClassPK), G = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/documents/${se}`), O(G), ee(se), i(!0), console.log("Grouped Related Assets: "), console.log(et);
    } catch (De) {
      console.error("Error fetching section Content:", De);
    }
  }, He = (ae, oe, we) => {
    let De = "";
    oe == "CMSID" ? De = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}
        /structured-contents?page=1&pageSize=1&flatten=true&${"search=" + we}` : oe == "articleKey" ? De = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}
        /structured-contents/by-key/${we}` : oe == "articleId" ? De = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/structured-contents/${we}` : oe == "itemUrl" && (De = we), O(De), ee(we);
  }, nt = async () => {
    var ae, oe, we, De;
    if (console.log("Selected tab data will be opened in new tab"), yt(J)) {
      console.debug("Existing Tab Activated");
      return;
    }
    console.debug("Requested Article ID is not available, data will be fetched");
    try {
      const ne = await (await Liferay.Util.fetch(
        _,
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      )).json(), he = ne != null && ne.items ? ne.items[0] : ne;
      if (!he || he.status == "NOT_FOUND") {
        console.warn("No data Found for the given Article Details");
        return;
      }
      if (!F.getValuesFromJson(he, "documentContent").data) {
        console.warn("No Docment Content Found to display"), N.size == 0 && Ct(he.id, he);
        const et = (ae = F.getValuesFromJson(he, "reportFile").document) != null && ae.contentUrl ? (oe = F.getValuesFromJson(he, "reportFile").document) == null ? void 0 : oe.contentUrl : "", se = (we = F.getValuesFromJson(he, "formPDF").document) != null && we.contentUrl ? (De = F.getValuesFromJson(he, "formPDF").document) == null ? void 0 : De.contentUrl : "", G = F.getValuesFromJson(he, "URLLink").link ? F.getValuesFromJson(he, "URLLink").link : "";
        et ? window.open(F.removeUrlAttribute(et, "download"), "_blank") : se ? window.open(F.removeUrlAttribute(se, "download"), "_blank") : G ? window.open(G, "_blank") : window.open(`/w/${he == null ? void 0 : he.friendlyUrlPath}`, "_blank");
        return;
      }
      Ct(he.id, he);
    } catch (ue) {
      console.error("Error fetching section Content:", ue);
    }
  }, yt = (ae) => N.has(ae) ? (console.debug("Active the Existing tab"), mt(ae), !0) : !1, Ct = (ae, oe) => {
    var De, ue;
    const we = {
      id: ae,
      articleData: oe,
      sectionContent: (De = F.getValuesFromJson(oe, "documentContent")) != null && De.data ? (ue = F.getValuesFromJson(oe, "documentContent")) == null ? void 0 : ue.data : 'No\x20Preview\x20Available'
    };
    mt(ae, oe), R((ne) => {
      const he = new Map(ne);
      if (!he.has(ae) && he.size >= r) {
        const et = he.keys().next().value;
        he.delete(et);
      }
      return he.set(String(ae), we), he;
    });
  }, rt = () => {
    i(!1), c(), f(), ee(), O(), E(), ie(), be(), R(/* @__PURE__ */ new Map());
    const ae = 'Document\x20Viewer\x20closed\x2c\x20returning\x20to\x20main\x20content\x2e';
    F.announceScreenReaderMessage(ae);
  }, mt = (ae, oe) => {
    var De;
    ee(), O(), oe || (oe = (De = N.get(ae)) == null ? void 0 : De.articleData), v(oe == null ? void 0 : oe.title), E(oe), p(F.getValuesFromJson(oe, "documentContent") ? F.getValuesFromJson(oe, "documentContent") : n);
    const we = ae.toString();
    f(we), ie(oe.id), be(oe), Ne.current = [we, ...Ne.current.filter((ue) => ue !== we)];
  };
  ye(() => {
    if (!_ || !J) {
      console.warn("No Article Id found");
      return;
    }
    nt();
  }, [J]), ye(() => {
    if (!s) {
      console.debug("Please select a Article to view the Realted Assets of the selected Article");
      return;
    }
    at();
  }, [s]), ye(() => {
    $(document).on("click", "a", Ze), window.viewSelectedRelatedAsset = He, window.openRelatedAssetsViewer = Me;
  }, []);
  const dt = (ae) => {
    if (N.size < 2) return;
    const oe = String(ae), we = new Map(N);
    we.delete(oe), Ne.current = Ne.current.filter((ue) => ue !== oe);
    let De = A;
    A === oe && (De = Ne.current.find((ne) => we.has(ne)) ?? (we.size > 0 ? we.keys().next().value : null)), R(we), De && De !== A && mt(De);
  }, Ie = async (ae) => {
    try {
      let oe;
      $e.size === 0 && (oe = await F.fetchRelatedContentCategories(), Se(oe));
      const we = await F.fetchRelatedContents(
        ae,
        "",
        $e.size === 0 ? oe : $e,
        /* @__PURE__ */ new Map()
      );
      return Te(we), we;
    } catch (oe) {
      console.error("Error fetching related assets:", oe);
    }
  }, Ue = (ae) => /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", null, /* @__PURE__ */ l.createElement(
    "div",
    {
      dangerouslySetInnerHTML: {
        __html: ae || u
      }
    }
  ))), Xe = () => /* @__PURE__ */ l.createElement(
    Ro,
    {
      activeKey: A,
      onSelect: (ae) => mt(ae),
      className: "doc-view-tabs"
    },
    Array.from(N.entries()).map(([ae, oe]) => {
      var we, De, ue, ne, he, et;
      return /* @__PURE__ */ l.createElement(
        Xa,
        {
          eventKey: ae,
          key: ae,
          title: /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("span", { className: "tab-data-title", title: (we = oe == null ? void 0 : oe.articleData) == null ? void 0 : we.title }, (De = oe == null ? void 0 : oe.articleData) == null ? void 0 : De.title), /* @__PURE__ */ l.createElement(
            "button",
            {
              className: "btn reset-btn-style tab-close",
              onClick: (se) => {
                se.stopPropagation(), dt(ae);
              },
              "aria-label": 'Close',
              disabled: N.size < 2
            },
            /* @__PURE__ */ l.createElement(re, { symbol: "etds-close" })
          ))
        },
        /* @__PURE__ */ l.createElement("div", { class: "doc-view-toolbar" }, /* @__PURE__ */ l.createElement("div", { className: "document-title text-truncate", "aria-label": `${'Section\x20Heading'} ${(ue = oe == null ? void 0 : oe.articleData) == null ? void 0 : ue.title}` }, (ne = oe == null ? void 0 : oe.articleData) == null ? void 0 : ne.title)),
        /* @__PURE__ */ l.createElement(
          "div",
          {
            ref: D,
            className: `doc-view-content-main ${C && "print-with-footnote"}`,
            id: `doc-key-${ae}`,
            "aria-label": 'Section\x20Content'
          },
          Ue(
            (he = F.getValuesFromJson(oe == null ? void 0 : oe.articleData, "documentContent")) != null && he.data ? (et = F.getValuesFromJson(oe == null ? void 0 : oe.articleData, "documentContent")) == null ? void 0 : et.data : 'No\x20Preview\x20Available'
          )
        )
      );
    })
  );
  return /* @__PURE__ */ l.createElement(l.Fragment, null, a && /* @__PURE__ */ l.createElement(hn, { observer: e, size: "xl", className: "document-viewer-modal" }, /* @__PURE__ */ l.createElement(hn.Body, { className: "p-0" }, L && /* @__PURE__ */ l.createElement("div", { className: "loading-overlay" }, /* @__PURE__ */ l.createElement(fd, { displayType: "secondary", size: "sm" })), /* @__PURE__ */ l.createElement("div", { className: "document-viewer-wrapper" }, /* @__PURE__ */ l.createElement("div", { className: "doc-view-sidebar" }, /* @__PURE__ */ l.createElement(To, { handleSidebarClick: F.handleDocumentViewerSidebarClick }), /* @__PURE__ */ l.createElement(ko, null, /* @__PURE__ */ l.createElement(
    Do,
    {
      printWithFootnote: C,
      setPrintWithFootnote: T,
      docViewContentId: "doc-key-" + A,
      printFrameRef: k
    }
  ), ge && /* @__PURE__ */ l.createElement(Ip, { id: ge, displayType: "sidebar" }), /* @__PURE__ */ l.createElement(Ap, { article: fe }), y && /* @__PURE__ */ l.createElement(
    sr,
    {
      key: J + "RelatedSideBar",
      title: 'Related\x20Content',
      iconName: "etds-list-view",
      isAccordion: !0,
      isAccordionOpen: !0
    },
    /* @__PURE__ */ l.createElement(Hp, { selectedItem: y, relatedContent: xe, viewSelectedContent: He })
  ))), /* @__PURE__ */ l.createElement("div", { className: "doc-view-section html-content-viewer", id: "related-assets-viewer" }, /* @__PURE__ */ l.createElement("span", { className: "sr-only", id: "footnote-aria-live", "aria-live": "assertive", "aria-atomic": "true" }), /* @__PURE__ */ l.createElement("div", { className: "doc-view-content-area" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn reset-btn-style close-doc-view-modal",
      onClick: t,
      "aria-label": 'Close'
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-close" })
  ), Xe()), /* @__PURE__ */ l.createElement(rc, null)), /* @__PURE__ */ l.createElement("span", { tabIndex: "0", "aria-hidden": "true", onFocus: () => {
    var ae;
    return (ae = document.querySelector("#sidebar-modal-btn")) == null ? void 0 : ae.focus();
  } })))));
}, zD = ({
  observer: e,
  onOpenChange: t,
  urlComponent: n,
  url: r
}) => {
  const a = Liferay.Icons.spritemap, [i, s] = V(!1), [c, u] = V('Share\x20this\x20page\x20popup\x20opened\x2e'), p = (y) => {
    const E = document.createElement("textarea");
    E.value = y, E.style.position = "fixed", document.body.appendChild(E), E.focus(), E.select();
    try {
      document.execCommand("copy");
    } catch (L) {
      console.error("Fallback: Failed to copy", L);
    }
    document.body.removeChild(E);
  }, g = () => {
    const y = window.location.href, E = () => {
      s(!0), u(`${'etds-copied-link'} ${r}`), setTimeout(() => {
        u(""), s(!1);
      }, 2e3);
    };
    navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(y).then(E).catch((L) => {
      console.error("Failed to copy URL:", L);
    }) : (p(y), E());
  }, v = () => {
    t(!1), setTimeout(() => u(""), 2e3);
  };
  return ye(() => {
    const y = (E) => {
      E.key === "Escape" && v();
    };
    return document.addEventListener("keydown", y), () => document.removeEventListener("keydown", y);
  }, []), /* @__PURE__ */ l.createElement(jr, { spritemap: a }, /* @__PURE__ */ l.createElement(
    hn,
    {
      observer: e,
      size: "sm",
      status: "info",
      className: "modal-dialog-centered modal-wrapper modal-social-media"
    },
    /* @__PURE__ */ l.createElement("div", { "aria-live": "assertive", className: "sr-only", "aria-atomic": "true" }, c),
    /* @__PURE__ */ l.createElement("div", { className: "modal-body" }, /* @__PURE__ */ l.createElement("h2", { className: "modal-heading h4", id: "clay-modal-label-1" }, 'Share\x20this\x20page\x21'), /* @__PURE__ */ l.createElement("hr", { className: "heading-line" }), /* @__PURE__ */ l.createElement("div", { className: "social-icons d-flex" }, /* @__PURE__ */ l.createElement("div", { className: "facebook social-icon" }, /* @__PURE__ */ l.createElement(
      "a",
      {
        href: `http://www.facebook.com/sharer.php?u=${n}`,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": `${'Share\x20On'} ${'Facebook'}`
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-facebook" })
    )), /* @__PURE__ */ l.createElement("div", { className: "twitter social-icon" }, /* @__PURE__ */ l.createElement(
      "a",
      {
        href: `https://twitter.com/intent/tweet?text=${n}&url=${n}`,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": `${'Share\x20On'} ${'X'}`
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-twitter" })
    )), /* @__PURE__ */ l.createElement("div", { className: "instagram social-icon" }, /* @__PURE__ */ l.createElement(
      "a",
      {
        href: "https://www.instagram.com",
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": `${'Share\x20On'} ${'Instagram'}`
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-instagram" })
    )), /* @__PURE__ */ l.createElement("div", { className: "linkedin social-icon" }, /* @__PURE__ */ l.createElement(
      "a",
      {
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${n}`,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": `${'Share\x20On'} ${'LinkedIn'}`
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-linkedin" })
    ))), /* @__PURE__ */ l.createElement("div", { className: "link-section" }, /* @__PURE__ */ l.createElement("div", { className: "title" }, 'Copy\x20this\x20link\x3a'), /* @__PURE__ */ l.createElement("div", { className: "copy-section" }, /* @__PURE__ */ l.createElement("div", { className: "url" }, r), /* @__PURE__ */ l.createElement(
      "button",
      {
        className: "copy btn btn-reset",
        "aria-label": 'etds-copy-link',
        onClick: g
      },
      i ? 'Copied' : 'Copy'
    )))),
    /* @__PURE__ */ l.createElement("div", { className: "modal-footer-section d-flex justify-content-between" }, /* @__PURE__ */ l.createElement("button", { type: "button", className: "btn btn-secondary", onClick: v }, 'Close'))
  ));
}, qD = ({
  observer: e,
  onOpenChange: t,
  singleVideo: n,
  modalTitle: r
}) => {
  var s, c, u;
  const a = Liferay.Icons.spritemap, i = n.videoLink.includes("embed") ? n.videoLink : `https://www.youtube.com/embed/${F.extractVideoID(
    n.videoLink
  )}`;
  return /* @__PURE__ */ l.createElement(jr, { spritemap: a }, /* @__PURE__ */ l.createElement(
    hn,
    {
      observer: e,
      size: "lg",
      className: "modal-dialog-centered modal-video-gallery"
    },
    /* @__PURE__ */ l.createElement("div", { "aria-live": "assertive", className: "sr-only" }, 'Video\x20Player', " ", 'popup\x20opened'),
    /* @__PURE__ */ l.createElement("div", { className: "etds-modal-header" }, /* @__PURE__ */ l.createElement("h2", { className: "modal-title mb-3 h4", id: "clay-modal-label-1" }, r ? 'Video\x20Player' : n.title), /* @__PURE__ */ l.createElement("button", { className: "p-0 reset-btn-style btn-modal-close", id: "btn-video-modal-close", onClick: () => t(!1), "aria-label": 'Close' }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-lg" }))),
    /* @__PURE__ */ l.createElement("div", { className: "modal-body border-0 pt-0" }, /* @__PURE__ */ l.createElement("p", { className: "video-title", id: "video-title" }, n.title), n.videoLink != "" ? /* @__PURE__ */ l.createElement("iframe", { src: i, frameborder: "0", allow: "autoplay; encrypted-media", allowfullscreen: "", "aria-describedby": "video-title", tabIndex: "0" }) : /* @__PURE__ */ l.createElement("video", { controls: !0, preload: "metadata", "aria-describedby": "video-title", tabIndex: "0" }, /* @__PURE__ */ l.createElement("source", { src: (s = n.videoUpload) == null ? void 0 : s.contentUrl, type: (c = n.videoUpload) == null ? void 0 : c.encodingFormat }), /* @__PURE__ */ l.createElement("track", { kind: "subtitles", src: (u = n.subtitleTrackUpload) == null ? void 0 : u.contentUrl, default: !0 }))),
    /* @__PURE__ */ l.createElement("span", { tabIndex: "0", "aria-hidden": "true", onFocus: () => {
      var p;
      return (p = document.querySelector("#btn-video-modal-close")) == null ? void 0 : p.focus();
    } })
  ));
}, WD = ({ video: e, onClick: t }) => {
  const r = `https://img.youtube.com/vi/${e.videoLink.includes("embed") ? e.videoLink.split("/").pop() : F.extractVideoID(e.videoLink)}/hqdefault.jpg`;
  return /* @__PURE__ */ l.createElement("button", { className: "video-gallery-item", onClick: t, "aria-label": `Video: ${e.title}` }, /* @__PURE__ */ l.createElement(
    "img",
    {
      src: e.thumbnailImage ? e.thumbnailImage : r,
      className: "video-thumbnail",
      alt: ""
    }
  ), /* @__PURE__ */ l.createElement("p", { className: "video-title", title: e.title }, e.title));
};
function sd({ row: e = [], mobileView: t = !1 }) {
  const n = (i) => `${(i / 1048576).toFixed(3)} ${'MB'}`, r = rn(() => {
    var g, v;
    const i = ((g = e.find((y) => y.name === "selectType")) == null ? void 0 : g.contentFieldValue) || {}, s = (i == null ? void 0 : i.value) === "pdf", c = s ? "reportFile" : "webContentLink", u = (v = e.find(
      (y) => y.name === c
    )) == null ? void 0 : v.contentFieldValue, p = {
      isPdf: s,
      title: "",
      size: "",
      url: ""
    };
    return s && (u != null && u.document) ? (p.title = u.document.title, p.size = n(u.document.sizeInBytes), p.url = u.document.contentUrl) : u != null && u.structuredContentLink && (p.title = u.structuredContentLink.title, p.size = "--", p.url = `/o/headless-delivery/v1.0/structured-contents/${u.structuredContentLink.id}`), p;
  }, [e]), a = (i, s) => {
    i ? window.open(s, "_blank", "noopener,noreferrer") : window.openDocumentViewer("Others", "itemUrl", s);
  };
  return /* @__PURE__ */ l.createElement(l.Fragment, null, t ? /* @__PURE__ */ l.createElement("div", { className: "download-item" }, /* @__PURE__ */ l.createElement("p", { className: "sub-heading-3-medium mb-0 label-title" }, 'Title'), /* @__PURE__ */ l.createElement("p", { className: "sub-heading-2-bold mb-0 text-primary" }, r.title), /* @__PURE__ */ l.createElement("p", { className: "sub-heading-3-medium mb-0 label-title" }, 'Size'), /* @__PURE__ */ l.createElement("p", { className: "sub-heading-2-medium mb-0" }, r.size), /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn btn-outline-primary btn-sm etds-misc__button d-flex align-items-center",
      onClick: () => a(r.isPdf, r.url)
    },
    /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: "etds-download-type-2-x20",
        className: "mr-2 fs-1-25 desktop-download"
      }
    ),
    /* @__PURE__ */ l.createElement("p", { className: "mb-0" }, 'Download\x20PDF')
  )) : /* @__PURE__ */ l.createElement("tr", null, /* @__PURE__ */ l.createElement("td", { class: "text-break" }, r.title), /* @__PURE__ */ l.createElement("td", null, r.size), /* @__PURE__ */ l.createElement("td", null, /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn btn-outline-primary btn-sm etds-misc__button d-flex align-items-center",
      onClick: () => a(r.isPdf, r.url)
    },
    /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: "etds-download-type-2-x20",
        className: "mr-2 fs-1-25 desktop-download"
      }
    ),
    /* @__PURE__ */ l.createElement("p", { className: "mb-0" }, 'Download\x20PDF')
  ))));
}
function YD(e) {
  const { open: t, observer: n, onOpenChange: r, selectDownloadItem: a, url: i } = e, [s, c] = V([]);
  return ye(() => {
    var u, p, g;
    if (t) {
      const v = ((g = (p = (u = a == null ? void 0 : a.embedded) == null ? void 0 : u.contentFields) == null ? void 0 : p.filter((y) => y.name === "downloadContent")) == null ? void 0 : g.map((y) => y.nestedContentFields)) || [];
      c(v);
    } else
      c([]);
  }, [t, a]), ye(() => {
    setTimeout(() => {
      const u = document.querySelector("#cca-dg-download-modal .modal-content");
      if (!u) return;
      const p = u.getAttribute("aria-labelledby"), g = document.querySelector('h5[data-aria-label-id-element="cca-dg-modal-header-aria-label-id-element"]');
      g && (g.id = p);
    }, 500);
  }, [t]), /* @__PURE__ */ l.createElement(l.Fragment, null, t && /* @__PURE__ */ l.createElement(
    hn,
    {
      observer: n,
      onClose: () => r(!1),
      className: "etds-cca-dg-modal",
      id: "cca-dg-download-modal"
    },
    /* @__PURE__ */ l.createElement("div", { class: "etds-cca-dg-modal-body" }, /* @__PURE__ */ l.createElement("div", { class: "etds-cca-dg-modal-body-top" }, /* @__PURE__ */ l.createElement(
      "h2",
      {
        class: "etds-cca-dg-modal__h5 mb-0 h5",
        "data-aria-label-id-element": "cca-dg-modal-header-aria-label-id-element"
      },
      a.title
    ), /* @__PURE__ */ l.createElement("div", { class: "etds-cca-dg-modal-i" }, /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: "etds-info",
        className: "mr-2",
        role: "img",
        "aria-label": "Information icon"
      }
    ), /* @__PURE__ */ l.createElement("p", { class: "etds-cca-dg-modal-i__p mb-0" }, /* @__PURE__ */ l.createElement("b", null, 'Information'), " :", " ", 'If\x20you\x20don’t\x20have\x20Adobe\x20Reader\x20or\x20PDF\x20support\x20in\x20this\x20web\x20browser\x2e', " ", /* @__PURE__ */ l.createElement(
      "a",
      {
        href: i || "https://get.adobe.com/reader/",
        target: "_blank",
        rel: "noopener noreferrer"
      },
      'Click\x20here\x20to\x20install\x20Adobe\x20Reader'
    )))), /* @__PURE__ */ l.createElement("div", { class: "etds-cca-dg-modal-download" }, /* @__PURE__ */ l.createElement("h3", { class: "etds-cca-dg-modal-download__h5 mb-0 h5" }, 'Downloads'), /* @__PURE__ */ l.createElement("div", { class: "container etds-cca-dg-modal-table" }, /* @__PURE__ */ l.createElement("div", { class: "table-radius" }, /* @__PURE__ */ l.createElement("table", { class: "home-modal-table-whats-new table" }, /* @__PURE__ */ l.createElement("thead", null, /* @__PURE__ */ l.createElement("tr", null, /* @__PURE__ */ l.createElement("th", null, 'Title'), /* @__PURE__ */ l.createElement("th", { class: "sizeTh" }, 'Size'), /* @__PURE__ */ l.createElement("th", { class: "linkTh" }, 'Link'))), /* @__PURE__ */ l.createElement("tbody", null, s.map((u, p) => /* @__PURE__ */ l.createElement(sd, { key: p, row: u }))))))), /* @__PURE__ */ l.createElement("div", { class: "etds-cca-dg-modal-download-mobile" }, /* @__PURE__ */ l.createElement("div", { className: "download-items" }, s.map((u, p) => /* @__PURE__ */ l.createElement(sd, { key: p, row: u, mobileView: !0 }))))),
    /* @__PURE__ */ l.createElement("div", { class: "etds-cca-dg-modal-footer" }, /* @__PURE__ */ l.createElement(
      "button",
      {
        class: "etds-cca-dg-modal__close-btn",
        onClick: () => r(!1),
        className: "btn btn-outline-primary-no-hover"
      },
      'Close'
    ))
  ));
}
const GD = () => (ye(() => {
  (async () => {
    try {
      if (window.globalConfigurations && Object.keys(window.globalConfigurations).length > 0) {
        console.debug("Global Configurations already loaded:", window.globalConfigurations);
        return;
      }
      const t = {
        restrictFields: "actions,creator,dateCreated,dateModified,keywords"
      }, n = await Ve.getGlobalConfigurations(t);
      if (Array.isArray(n) && n.length > 0 && n[0]) {
        const r = n[0].portalLastUpdatedDate, a = Liferay.ThemeDisplay.getLanguageId(), i = F.formatDate(
          r,
          a === "hi_IN" ? "dd-MMMM-yyyy" : "dd-MMM-yyyy"
        );
        window.globalConfigurations = {
          ...window.globalConfigurations || {},
          ...n[0],
          formattedPortalLastUpdatedDate: i
        };
      } else
        console.warn("Global configurations API returned empty or invalid response:", n);
      console.debug("Global Configurations loaded:", window.globalConfigurations);
    } catch (t) {
      console.error("Failed to load global data:", t);
    }
  })();
}, []), null), _T = (e) => {
  if (!e || !yl(new Date(e)))
    return "";
  const t = Liferay.ThemeDisplay.getLanguageId(), n = t === "hi_IN" ? El : qa, r = t === "hi_IN" ? "MMMM d, yyyy" : "MMMM do, yyyy";
  return eo(new Date(e), r, { locale: n });
}, jT = (e) => _T(e), KD = (e) => {
  const t = (e == null ? void 0 : e.props) ?? e ?? {}, n = MS(), {
    title: r = "",
    description: a = "",
    releaseDate: i = "",
    handleTenderItemSelect: s,
    redirectionUrl: c = "",
    record: u,
    titleToolTip: p
  } = t, g = jT(i), v = (E) => {
    var k, N, R;
    const L = ((k = E.find((A) => A.name === "selectType")) == null ? void 0 : k.contentFieldValue) || {}, x = (L == null ? void 0 : L.value) === "pdf", C = x ? "reportFile" : "webContentLink", T = (N = E.find(
      (A) => A.name === C
    )) == null ? void 0 : N.contentFieldValue;
    let D = "";
    x && (T != null && T.document) ? D = (R = T == null ? void 0 : T.document) == null ? void 0 : R.contentUrl : T != null && T.structuredContentLink && (D = `/o/headless-delivery/v1.0/structured-contents/${T.structuredContentLink.id}`), x ? window.open(D, "_blank", "noopener,noreferrer") : window.openDocumentViewer("Others", "itemUrl", D);
  }, y = (E, L = !1) => {
    var C, T, D, k, N;
    if (!L) {
      const R = ((C = F.getValuesFromJson(
        E,
        "portalRedirection"
      )) == null ? void 0 : C.data) || ((T = F.getValuesFromJson(
        E,
        "linkToPage"
      )) == null ? void 0 : T.data);
      if (R) {
        window.open(R, "_blank");
        return;
      }
    }
    const x = ((N = (k = (D = E == null ? void 0 : E.embedded) == null ? void 0 : D.contentFields) == null ? void 0 : k.filter((R) => R.name === "downloadContent")) == null ? void 0 : N.map((R) => R.nestedContentFields)) || [];
    x.length > 1 ? s(E) : v(x[0]);
  };
  return /* @__PURE__ */ l.createElement(vl, null, /* @__PURE__ */ l.createElement("div", { className: "card-print-btn-with-date-new-tag" }, /* @__PURE__ */ l.createElement("div", { className: "card-left-side" }, c ? /* @__PURE__ */ l.createElement(
    "a",
    {
      href: c,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "text-decoration-none card-title-texts",
      title: p || r,
      "data-tooltip-align": "top"
    },
    /* @__PURE__ */ l.createElement("p", { className: "card-title-with-arrow mb-0" }, F.truncateText(r)),
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-right-pagination-arrow" })
  ) : /* @__PURE__ */ l.createElement(
    "div",
    {
      className: "card-title-texts",
      "data-tooltip-align": "top",
      title: p || r,
      tabIndex: "0",
      role: "link",
      onClick: () => y(u),
      onKeyDown: (E) => {
        (E.key === "Enter" || E.key === " ") && (y(u), E.preventDefault());
      }
    },
    /* @__PURE__ */ l.createElement(
      "p",
      {
        className: "card-title-with-arrow mb-0"
      },
      F.truncateText(r)
    ),
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-right-pagination-arrow" })
  ), a && /* @__PURE__ */ l.createElement(
    "div",
    {
      className: "card-description",
      "data-tooltip-align": "top",
      title: a,
      "aria-hidden": a != null && a.trim() ? "false" : "true"
    },
    a != null && a.trim() ? F.truncateText(a) : null
  )), /* @__PURE__ */ l.createElement("div", { class: "card-right-side" }, /* @__PURE__ */ l.createElement(
    OS,
    {
      updatedDate: i,
      etdsConfigContext: n
    }
  ), /* @__PURE__ */ l.createElement("div", { className: "date-in-card" }, g), /* @__PURE__ */ l.createElement("div", { className: "common-pipe small-pipe" }), /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn btn-outline-primary btn-sm etds-misc__button",
      onClick: () => y(u, !0),
      "aria-label": `${'Download\x20PDF'} ${'for'} ${u.title}`
    },
    /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: "etds-download-1",
        className: "fs-1-25 mobile-download"
      }
    ),
    /* @__PURE__ */ l.createElement("p", { className: "mb-0" }, 'Download\x20PDF', " "),
    /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: "etds-download-type-2-x20",
        className: "ml-2 fs-1-25 desktop-download"
      }
    )
  ))));
}, JD = () => {
  const e = _e(null), [t, n] = V(!1), [r, a] = V(!1), [i, s] = V(""), [c, u] = V([]), { observer: p, onClose: g } = Br({
    // onClose: () => {
    //   setIsContentComparisonViewerOpen(false);
    //   window.setShowChangesEnabled(false);
    //   window.startParallelViewer(parallelViewContextList);
    // }
    onClose: () => {
      var C;
      if (n(!1), window.setShowChangesEnabled(!1), window.startParallelViewer(c), e.current) {
        const T = e.current.querySelector(
          "etds-it-bill-compare"
        );
        if (T) {
          const D = (C = T.shadowRoot) == null ? void 0 : C.querySelector(".app-container");
          D && (D.style.display = "none"), T.style.display = "none";
        }
      }
    }
  }), [v, y] = V(null), [E, L] = V(!1);
  _e(null);
  const x = async (C, T) => {
    var D, k, N, R;
    if ((C == null ? void 0 : C.length) < 2) {
      console.warn("At least two entries are needed for comparison.");
      return;
    }
    u(C);
    try {
      window.showLoader(), window.setShowChangesEnabled(!0);
      const A = Number(
        (D = C[0].articleData) == null ? void 0 : D.key
      ), f = Number(
        (k = C[1].articleData) == null ? void 0 : k.key
      ), _ = F.getActRuleDocumentViewerTitle(
        (N = C[0]) == null ? void 0 : N.articleData,
        T
      ).title + " - " + F.getActRuleDocumentViewerTitle(
        (R = C[1]) == null ? void 0 : R.articleData,
        T
      ).title;
      s(_);
      const O = Liferay.ThemeDisplay.getScopeGroupId(), J = Math.min(A, f), ee = Math.max(A, f);
      a(A != J);
      const ge = await Liferay.Util.fetch(
        `/o/web-content-diff/sites/${O}/web-contents/${J}/compare/${ee}`,
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      ).then((ie) => ie.json());
      if (!ge || !ge.htmlDiff) {
        console.error("Unable to get the HTMl Diff....");
        return;
      }
      n(!0), window.setIsParallelViewerOpen(!1), y(ge.htmlDiff);
    } catch (A) {
      console.debug(A);
    } finally {
      window.hideLoader();
    }
  };
  return ye(() => {
    window.showContentComparisonViewer = x;
  }, []), ye(() => {
    if (t && e.current) {
      let C = e.current.querySelector(
        "etds-it-bill-compare"
      );
      C || (C = document.createElement("etds-it-bill-compare"), e.current.appendChild(C)), C.style.display = "", setTimeout(() => {
        var D;
        const T = (D = C.shadowRoot) == null ? void 0 : D.querySelector(".app-container");
        T && (T.style.display = "flex");
      }, 50);
    }
  }, [t, v]), /* @__PURE__ */ l.createElement(l.Fragment, null, t && /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(
    hn,
    {
      observer: p,
      size: "xl",
      className: `document-viewer-modal parallel-viewer-modal ${r ? "content-comparision-reversed-view" : "content-comparision-view"}`
    },
    /* @__PURE__ */ l.createElement("div", { "aria-live": "assertive", className: "sr-only" }, 'Parallel\x20viewer\x20popup\x20opened', "."),
    /* @__PURE__ */ l.createElement(hn.Body, { className: "p-0 content-comparison-viewer-modal-body" }, /* @__PURE__ */ l.createElement("div", { className: "document-viewer-wrapper parallel-reading" }, /* @__PURE__ */ l.createElement("div", { className: "doc-view-section collapsed" }, /* @__PURE__ */ l.createElement("div", { className: "doc-view-content-area" }, /* @__PURE__ */ l.createElement("div", { class: "doc-view-tabs nav nav-tabs pr-1" }, /* @__PURE__ */ l.createElement("p", { className: "nav-item nav-link active" }, 'Show\x20Changes')), /* @__PURE__ */ l.createElement(
      "button",
      {
        className: "btn reset-btn-style close-doc-view-modal",
        onClick: g,
        "aria-label": 'Close\x20Popup'
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-close" })
    ), /* @__PURE__ */ l.createElement(
      "div",
      {
        className: `parallel-viewer-content-container d-flex ${r ? "content-comparision-reversed-view" : "content-comparision-view"}`,
        id: "contentComparisonViewerContainer"
      },
      /* @__PURE__ */ l.createElement(
        "span",
        {
          className: "sr-only",
          id: "footnote-aria-live",
          "aria-live": "assertive",
          "aria-atomic": "true"
        }
      ),
      /* @__PURE__ */ l.createElement(
        "div",
        {
          id: "compare-content-viewer",
          className: "col-12 px-1 selected-content-viewer mb-4 html-content-viewer"
        },
        /* @__PURE__ */ l.createElement("div", { className: "sectionContentViewer" }, /* @__PURE__ */ l.createElement("div", { className: "content-viewer-header d-flex justify-content-between" }, /* @__PURE__ */ l.createElement("h2", { className: "mb-0" }, /* @__PURE__ */ l.createElement("div", { className: "section-data text-primary sub-heading-2-medium" }, i))), /* @__PURE__ */ l.createElement(
          "div",
          {
            ref: e,
            className: `taglib-diff-html selected-section-content doc-view-content-main ${E && "print-with-footnote"}`,
            "aria-label": 'Section\x20Content'
          },
          /* @__PURE__ */ l.createElement("etds-it-bill-compare", null)
        ))
      )
    )))), /* @__PURE__ */ l.createElement(
      "span",
      {
        tabIndex: "0",
        "aria-hidden": "true",
        onFocus: () => {
          var C;
          return (C = document.querySelector("#sidebar-modal-btn")) == null ? void 0 : C.focus();
        }
      }
    ))
  )));
}, QD = () => {
  const [e, t] = V(!1), [n, r] = V(!1), [a, i] = V(!1), [s, c] = V(""), [u, p] = V([]), { observer: g, onClose: v } = Br({
    onClose: () => {
      t(!1), window.setShowChangesEnabled(!1), window.startParallelViewer(u);
    }
  }), [y, E] = V(null), [L, x] = V(null), [C, T] = V(""), [D, k] = V(""), [N, R] = V(!1), A = _e(null), f = async (_, O) => {
    if ((_ == null ? void 0 : _.length) < 3) {
      console.warn("At least three entries are needed for comparison.");
      return;
    }
    p(_);
    try {
      window.showLoader(), window.setShowChangesEnabled(!0);
      const J = _[0].articleData, ee = _[1].articleData, ge = _[2].articleData;
      T(`${F.getActRuleDocumentViewerTitle(J, O).title} vs ${F.getActRuleDocumentViewerTitle(ee, O).title}`), k(`${F.getActRuleDocumentViewerTitle(J, O).title} vs ${F.getActRuleDocumentViewerTitle(ge, O).title}`);
      const ie = Liferay.ThemeDisplay.getScopeGroupId(), fe = async (Se, xe) => {
        const Te = Se > xe, We = await Liferay.Util.fetch(
          `/o/web-content-diff/sites/${ie}/web-contents/${Math.min(Number(Se), Number(xe))}/compare/${Math.max(Number(Se), Number(xe))}`,
          {
            method: "GET",
            headers: { "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId() }
          }
        ).then((Oe) => Oe.json());
        return {
          html: (We == null ? void 0 : We.htmlDiff) || "",
          isReversed: Te
        };
      }, [be, $e] = await Promise.all([
        fe(J.key, ee.key),
        fe(J.key, ge.key)
      ]);
      E(be.html), r(be.isReversed), x($e.html), i($e.isReversed), t(!0), window.setIsParallelViewerOpen(!1);
    } catch (J) {
      console.debug(J);
    } finally {
      window.hideLoader();
    }
  };
  return ye(() => {
    window.showDTAAContentComparisonViewer = f;
  }, []), /* @__PURE__ */ l.createElement(l.Fragment, null, e && /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(hn, { observer: g, size: "xl", className: "document-viewer-modal parallel-viewer-modal" }, /* @__PURE__ */ l.createElement("div", { "aria-live": "assertive", className: "sr-only" }, 'Parallel\x20viewer\x20popup\x20opened', "."), /* @__PURE__ */ l.createElement(hn.Body, { className: "p-0 content-comparison-viewer-modal-body" }, /* @__PURE__ */ l.createElement("div", { className: "document-viewer-wrapper parallel-reading" }, /* @__PURE__ */ l.createElement("div", { className: "doc-view-sidebar collapsed" }, /* @__PURE__ */ l.createElement(To, { handleSidebarClick: F.handleDocumentViewerSidebarClick }), /* @__PURE__ */ l.createElement(ko, null, /* @__PURE__ */ l.createElement(
    Do,
    {
      printWithFootnote: N,
      setPrintWithFootnote: R,
      docViewContentId: "contentComparisonViewerContainer",
      printFrameRef: A
    }
  ))), /* @__PURE__ */ l.createElement("div", { className: "doc-view-section collapsed" }, /* @__PURE__ */ l.createElement("div", { className: "doc-view-content-area" }, /* @__PURE__ */ l.createElement("div", { class: "doc-view-tabs nav nav-tabs pr-1" }, /* @__PURE__ */ l.createElement("p", { className: "nav-item nav-link active" }, 'Show\x20Changes')), /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn reset-btn-style close-doc-view-modal",
      onClick: v,
      "aria-label": 'Close\x20Popup'
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-close" })
  ), /* @__PURE__ */ l.createElement("div", { className: "parallel-viewer-content-container d-flex", id: "contentComparisonViewerContainer" }, /* @__PURE__ */ l.createElement("span", { className: "sr-only", id: "footnote-aria-live", "aria-live": "assertive", "aria-atomic": "true" }), /* @__PURE__ */ l.createElement(
    "div",
    {
      id: "left-content-viewer",
      className: `col-6 px-1 selected-content-viewer mb-4 html-content-viewer ${n ? "content-comparision-reversed-view" : "content-comparision-view"}`
    },
    /* @__PURE__ */ l.createElement("div", { className: "sectionContentViewer" }, /* @__PURE__ */ l.createElement("div", { className: "content-viewer-header d-flex justify-content-between" }, /* @__PURE__ */ l.createElement("h2", { className: "mb-0" }, /* @__PURE__ */ l.createElement("div", { className: "section-data text-primary sub-heading-2-medium" }, C))), /* @__PURE__ */ l.createElement(
      "div",
      {
        dangerouslySetInnerHTML: { __html: y },
        className: `taglib-diff-html selected-section-content doc-view-content-main ${N && "print-with-footnote"}`,
        "aria-label": 'Section\x20Content'
      }
    ))
  ), /* @__PURE__ */ l.createElement(
    "div",
    {
      id: "right-content-viewer",
      className: `col-6 px-1 selected-content-viewer mb-4 html-content-viewer ${a ? "content-comparision-reversed-view" : "content-comparision-view"}`
    },
    /* @__PURE__ */ l.createElement("div", { className: "sectionContentViewer" }, /* @__PURE__ */ l.createElement("div", { className: "content-viewer-header d-flex justify-content-between" }, /* @__PURE__ */ l.createElement("h2", { className: "mb-0" }, /* @__PURE__ */ l.createElement("div", { className: "section-data text-primary sub-heading-2-medium" }, D))), /* @__PURE__ */ l.createElement(
      "div",
      {
        dangerouslySetInnerHTML: { __html: L },
        className: `taglib-diff-html selected-section-content doc-view-content-main ${N && "print-with-footnote"}`,
        "aria-label": 'Section\x20Content'
      }
    ))
  ))))), /* @__PURE__ */ l.createElement("span", { tabIndex: "0", "aria-hidden": "true", onFocus: () => {
    var _;
    return (_ = document.querySelector("#sidebar-modal-btn")) == null ? void 0 : _.focus();
  } })))));
}, VT = Liferay.Icons.spritemap, XD = ({
  fetchMainItems: e,
  fetchSearchItems: t,
  useLocalSearch: n = !1,
  onSelect: r,
  selectedItem: a,
  localSearchFilter: i = null,
  scrollMoreMainItems: s = !0,
  label: c = "etds-service-category",
  placeholder: u = 'Select',
  searchPlaceholder: p = 'Search',
  error: g = "",
  disabled: v = !1,
  isMandatory: y = !1
}) => {
  const [E, L] = V([]), [x, C] = V(1), [T, D] = V(!0), [k, N] = V([]), [R, A] = V([]), [f, _] = V(1), [O, J] = V(!0), [ee, ge] = V(""), [ie, fe] = V(!1), [be, $e] = V(!1), [Se, xe] = V(!1), [Te, We] = V(!1), [Oe, Ne] = V(-1), [Me, Ze] = V(-1), at = _e(null), He = _e(null), nt = _e(!1), yt = _e(1), Ct = _e(1), rt = _e(null);
  ye(() => {
    (async () => {
      $e(!0), nt.current = !0;
      try {
        const ne = await e(1);
        L(ne.results), D(ne.hasMore), ne.currentPage && C(Number(ne.currentPage)), ne.currentPage && (yt.current = Number(ne.currentPage)), n && N(ne.results);
      } catch (ne) {
        console.error("Error loading initial data:", ne);
      } finally {
        $e(!1), nt.current = !1;
      }
    })();
  }, [e, n]), ye(() => {
    yt.current = x;
  }, [x]), ye(() => {
    Ct.current = f;
  }, [f]), ye(() => {
    if (ee.trim() === "") {
      fe(!1), We(!1);
      return;
    }
    if (Se) {
      const ue = setTimeout(() => {
        dt(ee);
      }, 1e3);
      return () => clearTimeout(ue);
    }
  }, [ee, Se]);
  const mt = (ue) => {
    const ne = ue.toLowerCase();
    return i ? k.filter((he) => i(he, ue)) : k.filter(
      (he) => {
        var et;
        return ((et = he.title) == null ? void 0 : et.toLowerCase().includes(ne)) || JSON.stringify(he).toLowerCase().includes(ne);
      }
    );
  }, dt = async (ue) => {
    if (ue.trim() === "") {
      We(!1), fe(!1);
      return;
    }
    if (We(!0), fe(!0), _(1), Ct.current = 1, n) {
      const ne = mt(ue);
      A(ne), J(!1);
      return;
    }
    $e(!0), nt.current = !0;
    try {
      const ne = await t(1, ue);
      A(ne.results), J(ne.hasMore), ne.currentPage && _(Number(ne.currentPage)), ne.currentPage && (Ct.current = Number(ne.currentPage));
    } catch (ne) {
      console.error("Error during search:", ne);
    } finally {
      $e(!1), nt.current = !1;
    }
  }, Ie = async () => {
    if (nt.current || !T) return;
    const ue = yt.current + 1;
    $e(!0), nt.current = !0;
    try {
      const ne = await e(ue);
      C(ne.currentPage ? Number(ne.currentPage) : ue), yt.current = ne.currentPage ? Number(ne.currentPage) : ue, D(ne.hasMore);
      const he = ne.results;
      L((et) => [...et, ...he]), n && N((et) => [...et, ...he]);
    } catch (ne) {
      console.error(`Error loading main page ${ue}:`, ne);
    } finally {
      $e(!1), nt.current = !1;
    }
  }, Ue = async () => {
    if (nt.current || !O || !Te || n)
      return;
    const ue = Ct.current + 1;
    $e(!0), nt.current = !0;
    try {
      const ne = await t(ue, ee);
      _(ne.currentPage ? Number(ne.currentPage) : ue), Ct.current = ne.currentPage ? Number(ne.currentPage) : ue, J(ne.hasMore), A((he) => [...he, ...ne.results]);
    } catch (ne) {
      console.error(`Error loading search page ${ue}:`, ne);
    } finally {
      $e(!1), nt.current = !1;
    }
  };
  ye(() => {
    const ue = (ne) => {
      at.current && !at.current.contains(ne.target) && xe(!1);
    };
    return document.addEventListener("mousedown", ue), () => {
      document.removeEventListener("mousedown", ue);
    };
  }, []);
  const Xe = (ue) => {
    if (nt.current) return;
    const ne = ue.target;
    ne.scrollTop + ne.clientHeight >= ne.scrollHeight - 20 && (ie ? !n && O && Ue() : T && Ie());
  }, ae = () => {
    xe(!Se), Ne(-1), Se || (ge(""), fe(!1));
  }, oe = (ue) => {
    r(ue), xe(!1), Ne(-1);
  }, we = (ue) => {
    var ne, he, et, se, G, Re, bt;
    if (!Se)
      (ue.key === "Enter" || ue.key === " " || ue.key === "ArrowDown") && ae();
    else {
      const St = ie ? R : E, an = St.length - 1;
      if (ue.key === "ArrowDown") {
        ue.preventDefault();
        const ct = Oe >= an ? 0 : Oe + 1;
        Ne(ct), (et = (he = (ne = He.current) == null ? void 0 : ne.children) == null ? void 0 : he[ct]) == null || et.scrollIntoView({ block: "nearest" });
      } else if (ue.key === "ArrowUp") {
        ue.preventDefault();
        const ct = Oe <= 0 ? an : Oe - 1;
        Ne(ct), (Re = (G = (se = He.current) == null ? void 0 : se.children) == null ? void 0 : G[ct]) == null || Re.scrollIntoView({ block: "nearest" });
      } else ue.key === "Enter" ? (ue.preventDefault(), Oe >= 0 && St[Oe] && oe(St[Oe]), (bt = rt == null ? void 0 : rt.current) == null || bt.focus()) : (ue.key === "Escape" || ue.key === "Tab" || ue.key === "Tab" && ue.shiftKey) && xe(!1);
    }
  }, De = ie ? R : E;
  return /* @__PURE__ */ l.createElement(hl.Provider, { value: VT }, /* @__PURE__ */ l.createElement("div", { className: `form-group-item ${g ? "error-wrapper" : ""}` }, /* @__PURE__ */ l.createElement("div", { className: "control-label text-truncate", id: "sections-label" }, Liferay.Language.get(c), " ", y && /* @__PURE__ */ l.createElement("span", { className: "text-danger", "aria-label": 'Required' }, /* @__PURE__ */ l.createElement("span", { "aria-hidden": "true" }, "*"))), /* @__PURE__ */ l.createElement("div", { className: `dropdown-container ${v ? "disabled" : ""}`, ref: at, disabled: v }, /* @__PURE__ */ l.createElement(
    "div",
    {
      className: `selected-item text-truncate ${a ? "" : "placeholder"} ${Se ? "open" : ""}`,
      ref: rt,
      title: a ? a.title : "",
      onClick: v ? void 0 : ae,
      onKeyDown: v ? void 0 : we,
      tabIndex: v ? -1 : 0,
      "aria-labelledby": "sections-label",
      role: "combobox",
      "aria-expanded": Se,
      "aria-haspopup": "listbox",
      "aria-controls": "dropdown-listbox",
      "aria-disabled": v
    },
    a ? a.title : u,
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-down-arrow", className: `down-arrow-icon ${Se && "open"}` })
  ), Se && /* @__PURE__ */ l.createElement("div", { className: "dropdown-content" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      type: "text",
      className: "search-input",
      placeholder: p,
      value: ee,
      onChange: (ue) => ge(ue.target.value),
      "aria-activedescendant": Oe >= 0 ? `dropdown-item-${Oe}` : Me >= 0 ? `dropdown-item-${Me}` : void 0,
      onKeyDown: we,
      "aria-label": p,
      autoFocus: !0
    }
  ), /* @__PURE__ */ l.createElement("div", { id: "dropdown-listbox", className: "items-list", ref: He, onScroll: Xe, role: "listbox" }, De.length > 0 ? De.map((ue, ne) => /* @__PURE__ */ l.createElement(
    "div",
    {
      id: `dropdown-item-${ne}`,
      key: `${ue.id || ne}`,
      role: "option",
      "aria-selected": a && (ue == null ? void 0 : ue.id) === (a == null ? void 0 : a.id),
      className: `item ${a && (ue == null ? void 0 : ue.id) === (a == null ? void 0 : a.id) ? "selected" : ""} ${Oe === ne ? "active" : ""} ${Me === ne ? "hover" : ""}`,
      onClick: () => oe(ue),
      onMouseEnter: () => Ze(ne)
    },
    ue.title
  )) : /* @__PURE__ */ l.createElement("div", { className: "no-items", role: "alert", "aria-live": "polite" }, be ? 'Loading' : ie ? 'No\x20matching\x20items\x20found' : 'No\x20items\x20available'), be && De.length > 0 && /* @__PURE__ */ l.createElement("div", { className: "loading" }, 'Loading\x20more\x20items')))), /* @__PURE__ */ l.createElement("div", { "aria-live": "polite", className: "sr-only", id: "selection-announcer" }, a ? `${a.title} selected` : ""), g && /* @__PURE__ */ l.createElement("span", { "aria-live": "assertive", role: "alert", className: "custom-error" }, " ", /* @__PURE__ */ l.createElement(re, { symbol: "info-circle" }), " ", g)));
}, At = {
  ARTICLE: "DTAA_Article",
  SUBJECT: "DTAA_Subject",
  FULL_TREATY: "DTAA_FULL_TREATY"
}, UT = ({ selectedSectionContext: e, setSelectedSectionContext: t, sectionId: n }) => {
  const r = {
    Sections: 'Acts',
    Rules: 'Rules',
    DTAA: 'Double\x20Taxation\x20Avoidance\x20Agreement'
  }, a = {
    Sections: "Sections",
    Rules: "Rules",
    DTAA: "DTAA"
  }, i = Object.entries(a).map(([te, de]) => ({
    value: te,
    label: r[te]
  })), s = i.reduce((te, de) => (te[de.value] = de, te), {}), c = {
    Sections: ["choose-act", "amended-year", "tax-section"],
    Rules: ["choose-rule", "choose-rule-content"]
  }, [u, p] = V(s[e == null ? void 0 : e.entityName]), [g, v] = V([]), [y, E] = V(), [L, x] = V([]), [C, T] = V(), [D, k] = V(!1), [N, R] = V([]), [A, f] = V(), [_, O] = V(), [J, ee] = V(), [ge, ie] = V(!0), [fe, be] = V([]), [$e, Se] = V([]), [xe, Te] = V([]), [We, Oe] = V([]), [Ne, Me] = V(), [Ze, at] = V(), [He, nt] = V(), [yt, Ct] = V(), [rt, mt] = V(), [dt, Ie] = V(), [Ue, Xe] = V(), [ae, oe] = V(), [we, De] = V(!1), ue = (te) => {
    console.debug("Changing Entity now ..."), p(te), E(null), T(null), x([]), v([]), R([]), ee(null), f(null), O(null), t((de) => ({
      ...de,
      entityName: te.value
    }));
  }, ne = (te) => {
    T(null), O(null), R([]), ee(null), te.hasAmendments ? (k(!0), St(te)) : k(!1), E(te);
  }, he = (te) => {
    O(te == null ? void 0 : te.value), f(te == null ? void 0 : te.itemURL), ee(te);
  }, et = () => {
    var Fe;
    let te, de;
    if ((u == null ? void 0 : u.value) == a.Sections || (u == null ? void 0 : u.value) == a.Rules)
      te = A, de = _;
    else if ((u == null ? void 0 : u.value) == a.DTAA) {
      const Be = {
        [At.SUBJECT]: Ue == null ? void 0 : Ue.itemURL,
        [At.ARTICLE]: rt == null ? void 0 : rt.itemURL,
        [At.FULL_TREATY]: He == null ? void 0 : He.itemURL
      };
      te = Be[ae], de = (Fe = Be[ae]) == null ? void 0 : Fe.value;
    }
    t((Be) => ({
      ...Be,
      actId: y == null ? void 0 : y.value,
      yearId: C == null ? void 0 : C.value,
      sectionUrl: te,
      sectionId: de,
      entityName: u == null ? void 0 : u.value
    }));
  }, se = () => {
    E(null), T(null), k(!1), O(null), ee(null);
  }, G = (te) => {
    var de;
    return (de = c[u == null ? void 0 : u.value]) == null ? void 0 : de.includes(te);
  }, Re = async () => {
    let te;
    try {
      const de = {
        fields: "nameOfAct,pageURL,assetCategoryID,id,hasAmendments,isInactive,exclusionYears",
        filter: "status/any(x:(x eq 0)) and isInactive eq false",
        pageSize: -1,
        restrictFields: "actions",
        sort: "nameOfAct:asc"
      }, Fe = F.createQueryString(de), Tt = await (await Liferay.Util.fetch(
        `/o/c/actassetcategories/?${Fe}`,
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      )).json();
      if (!Tt || !Tt.items.length) {
        console.warn("No data Found");
        return;
      }
      const Ge = Tt.items.map(({ assetCategoryID: ot, nameOfAct: Nt, ...bn }) => ({ value: ot, label: Nt, ...bn }));
      v(Ge), y ? (te = Ge.find((ot) => ot.value == y.value), k(te == null ? void 0 : te.hasAmendments)) : e != null && e.actId && (te = Ge.find((ot) => ot.value == (e == null ? void 0 : e.actId)), k(te == null ? void 0 : te.hasAmendments), E(te)), St(te);
    } catch (de) {
      console.error("Error fetching acts:", de);
    }
  }, bt = async () => {
    try {
      window.showLoader();
      const te = {
        fields: "nameOfRule,pageURL,assetCategoryID,id",
        filter: "status/any(x:(x eq 0))",
        pageSize: -1,
        restrictFields: "actions",
        sort: "nameOfRule:asc"
      }, de = F.createQueryString(te), Be = await (await Liferay.Util.fetch(
        `/o/c/rules/?${de}`,
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      )).json();
      if (!Be || !Be.items.length) {
        console.warn("No data Found");
        return;
      }
      const Tt = Be.items.map(({ assetCategoryID: Ge, nameOfRule: ot, ...Nt }) => ({ value: Ge, label: ot, ...Nt }));
      if (v(Tt), y) {
        const Ge = Tt.find((ot) => ot.value == y.value);
        k(Ge.hasAmendments);
      }
      if (k(!1), e != null && e.actId) {
        const Ge = Tt.find((ot) => ot.value == (e == null ? void 0 : e.actId));
        E(Ge);
      }
    } catch (te) {
      console.error("Error fetching rules:", te);
    } finally {
      window.hideLoader();
    }
  }, St = async (te) => {
    let Fe = (te != null && te.exclusionYears ? te.exclusionYears.split(",").map((Be) => Be.trim()) : []).map((Be) => `year ne '${Be}'`).join(" and ");
    Fe = Fe.length > 0 ? `${Fe} and status/any(x:(x eq 0))` : "status/any(x:(x eq 0))";
    try {
      const Be = {
        sort: "year:desc",
        filter: Fe,
        restrictFields: "actions,creator,dateCreated,dateModified,externalReferenceCode",
        pageSize: -1
      }, Tt = F.createQueryString(Be), ot = await (await Liferay.Util.fetch(
        `/o/c/yearassetcategories/?${Tt}`,
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      )).json();
      if (!ot || !ot.items.length) {
        console.warn("No data Found");
        return;
      }
      const Nt = ot.items.map(({ assetCategoryID: bn, year: fn, ...Zt }) => ({ value: bn, label: fn, ...Zt }));
      if (x(Nt), e != null && e.yearId) {
        const bn = Nt.find((fn) => fn.value == (e == null ? void 0 : e.yearId));
        T(bn);
      }
    } catch (Be) {
      console.error("Error fetching years:", Be);
    }
  }, an = async () => {
    if (D && !C)
      return;
    const te = F.createSearchBody(
      {
        act_id: y == null ? void 0 : y.value
      },
      {
        emptySearch: !0,
        erc: "ACT_SECTIONS_BP_ERC"
      }
    );
    (D || C) && (te.attributes["search.experiences.year_id"] = C == null ? void 0 : C.value);
    try {
      window.showLoader();
      let de = 1;
      const Fe = 500;
      let Be = [];
      for (; Be.length < 2e3; ) {
        const Ge = await Ve.getSearchResults(te, { page: de, pageSize: Fe });
        if (!Ge || !Array.isArray(Ge.items) || (Be = Be.concat(Ge.items), typeof Ge.lastPage == "number" && Ge.page >= Ge.lastPage) || Ge.items.length === 0) break;
        de++;
      }
      const Tt = Be.map(({ itemURL: Ge, title: ot, ...Nt }) => ({
        value: F.getLastSegment(Ge, "/"),
        label: ot,
        itemURL: Ge,
        ...Nt
      }));
      R(Tt);
    } catch (de) {
      console.error("Error during search:", de);
    } finally {
      window.hideLoader();
    }
  }, ct = async () => {
    window.showLoader();
    const te = F.createSearchBody(
      {
        rule_id: y == null ? void 0 : y.value
      },
      {
        emptySearch: !0,
        erc: "RULE_CONTENT_LIST_BP_ERC"
      }
    );
    try {
      let de = 1;
      const Fe = 500;
      let Be = [];
      for (; Be.length < 2e3; ) {
        const Ge = await Ve.getSearchResults(te, { page: de, pageSize: Fe });
        if (!Ge || !Array.isArray(Ge.items) || (Be = Be.concat(Ge.items), typeof Ge.lastPage == "number" && Ge.page >= Ge.lastPage) || Ge.items.length === 0) break;
        de++;
      }
      const Tt = Be.map(({ itemURL: Ge, title: ot, ...Nt }) => ({
        value: F.getLastSegment(Ge, "/"),
        label: ot,
        itemURL: Ge,
        ...Nt
      }));
      if (R(Tt), _) {
        const Ge = Tt.find((ot) => ot.value == _.value);
        f(Ge == null ? void 0 : Ge.itemURL);
      }
    } catch (de) {
      console.error("Error during search:", de);
    } finally {
      window.hideLoader();
    }
  }, yn = async (te) => {
    Me(te), nt(null), mt(null), Xe(null), ie(!0);
    const Fe = (await Qt(te, null, null, null)).items.filter((Be) => {
      var Tt;
      return (Tt = F.getValuesFromJson(Be, "documentContent")) == null ? void 0 : Tt.data;
    });
    nn.getFilteredCategoryDropdownOptions(Fe, $e, at);
  }, un = async (te) => {
    nt(te), mt(null), Xe(null);
    const de = await Qt(Ne, te, null, null);
    nn.getFilteredCategoryDropdownOptions(de.items, xe, Ct), nn.getFilteredCategoryDropdownOptions(de.items, We, Ie);
  }, Ot = async (te) => {
    if ((te == At.ARTICLE || te == At.SUBJECT) && ae == At.FULL_TREATY) {
      const de = await Qt(Ne, He, null, null, te);
      nn.getFilteredCategoryDropdownOptions(de.items, xe, Ct), nn.getFilteredCategoryDropdownOptions(de.items, We, Ie);
    } else if (te == At.FULL_TREATY) {
      const de = await Qt(Ne, null, null, null, At.FULL_TREATY);
      nn.getFilteredCategoryDropdownOptions(de.items, $e, at);
    }
    oe(te);
  }, Ht = () => {
    console.debug("Acts Selecotr Initialization"), console.debug(e), p(s[a.Sections]), Re();
  }, dn = () => {
    console.debug("Rules Selecotr Initialization"), console.debug(e), p(s[a.Rules]), bt();
  }, Dn = async () => {
    if (console.debug("DTAA Selecotr Initialization"), console.debug(e), !e) {
      console.debug("No Context available to initialize the DTAA Selector");
      return;
    }
    p(s[a.DTAA]), oe(e.dtaaViewType);
    let te = fe;
    fe.length === 0 && (te = await nn.filterCategoryDropdownOptions("Country", e.countriesList, be, be, null, !1, null, "DTAA_COMPARE"));
    let de = $e;
    $e.length === 0 && (de = await nn.filterCategoryDropdownOptions("DTAA Type", e.dtaaTypeList, Se, Se, null, !1, null, "DTAA_COMPARE"));
    let Fe = xe;
    xe.length === 0 && (Fe = await nn.filterCategoryDropdownOptions("Article Number", e.articleNumbersList, Te, Te, null, !1, null, "DTAA_COMPARE"));
    let Be = We;
    We.length === 0 && (Be = await nn.filterCategoryDropdownOptions("Subject Name", e.subjectsList, Oe, Oe, null, !1, null, "DTAA_COMPARE"));
    const Tt = e.articleData.taxonomyCategoryBriefs.map((Zt) => String(Zt.taxonomyCategoryId)), Ge = te == null ? void 0 : te.find((Zt) => Tt.includes(Zt.value));
    let ot = de == null ? void 0 : de.find((Zt) => Tt.includes(Zt.value));
    Me(Ge);
    const bn = (await Qt(Ge, null, null, null, At.FULL_TREATY)).items.filter((Zt) => {
      var qr;
      return (qr = F.getValuesFromJson(Zt, "documentContent")) == null ? void 0 : qr.data;
    }), fn = nn.getFilteredCategoryDropdownOptions(bn, de, at);
    if (nt(fn == null ? void 0 : fn.find((Zt) => Tt.includes(Zt.value))), e.dtaaViewType == At.ARTICLE || e.dtaaViewType == At.SUBJECT) {
      const Zt = await Qt(Ge, ot, null, null, e.dtaaViewType);
      nn.getFilteredCategoryDropdownOptions(Zt.items, Fe, Ct), nn.getFilteredCategoryDropdownOptions(Zt.items, Be, Ie);
    }
  }, Qt = async (te, de, Fe, Be, Tt = ae) => {
    try {
      const Ge = Fe != null && Fe.value ? Fe.value : null, ot = Be != null && Be.value ? Be.value : null;
      let Nt;
      Tt === At.FULL_TREATY ? Nt = "DTAA_FULL_TREATY_BP_ERC" : Nt = "DTAA_ARTICLE_SUBJECT_BP_ERC";
      let bn = F.createSearchBody(
        {
          country: te != null && te.value ? te.value : null,
          dtaa_type: de != null && de.value ? de.value : null,
          article_number: Ge,
          subject: ot,
          dtaa_active: !0
        },
        {
          emptySearch: !0,
          erc: Nt
        }
      );
      const fn = {
        nestedFields: "embedded",
        page: 1,
        pageSize: -1,
        fields: "itemURL,title,embedded.friendlyUrlPath,embedded.id,embedded.key,embedded.taxonomyCategoryBriefs,embedded.contentFields",
        restrictFields: "actions,creator"
      };
      return await Ve.getSearchResults(bn, fn);
    } catch (Ge) {
      return console.error("Error fetching data:", Ge), null;
    }
  }, kn = () => {
    Me(null), nt(null), mt(null), Xe(null), oe(null);
  }, Rn = () => ae == At.FULL_TREATY ? He == null || He == null : ae == At.ARTICLE ? rt == null || rt == null : ae == At.SUBJECT ? Ue == null || Ue == null : !0, dr = () => _ == "" || _ == null || _ == null, En = () => {
    se(), kn(), ie(!0);
  };
  ye(() => {
    if (!e) {
      console.debug("No Context available to render the Section Selector");
      return;
    }
    const te = {
      Sections: Ht,
      Rules: dn,
      DTAA: Dn
    };
    if (!te[e.entityName]) {
      console.debug("Please select an entity type");
      return;
    }
    te[e.entityName]();
  }, [e]), ye(() => {
    if (!y) {
      console.debug("No Act selected to get the Sections Data");
      return;
    }
    if (D && !C) {
      console.debug("No Year selected to get the Sections Data");
      return;
    }
    e.entityName === "Sections" && an(), e.entityName === "Rules" && ct();
  }, [y, C]), ye(() => {
    if (ie(!0), (u == null ? void 0 : u.value) == a.Sections || (u == null ? void 0 : u.value) == a.Rules) {
      ie(dr());
      return;
    }
    if ((u == null ? void 0 : u.value) == a.DTAA) {
      ie(Rn());
      return;
    }
  }, [u, _, ae, He, rt, Ue]);
  const Xt = () => /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Act',
      name: "etds-act",
      placeholder: 'Choose\x20Act',
      options: g,
      value: G("choose-act") ? y : null,
      handleChange: ne,
      setIsOpen: De,
      noOptionsMessage: F.customNoOptionsMessage,
      isMandatory: !0
    }
  )), /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Year',
      name: "etds-year",
      placeholder: 'Year',
      value: G("amended-year") ? C : null,
      options: L,
      handleChange: T,
      setIsOpen: De,
      noOptionsMessage: F.customNoOptionsMessage,
      isMandatory: !0,
      isDisabled: !D
    }
  )), /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Section',
      name: "etds-section",
      placeholder: 'Section',
      options: N,
      handleChange: he,
      setIsOpen: De,
      noOptionsMessage: F.customNoOptionsMessage,
      isMandatory: !0,
      value: J
    }
  ))), zt = () => /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Rule',
      name: "etds-rule",
      placeholder: 'Rule',
      options: g,
      value: G("choose-rule") ? y : null,
      handleChange: ne,
      setIsOpen: De,
      noOptionsMessage: F.customNoOptionsMessage,
      isMandatory: !0
    }
  )), /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Rule\x20Content',
      name: "etds-rule-content",
      placeholder: 'Rule\x20Content',
      options: N,
      handleChange: he,
      setIsOpen: De,
      noOptionsMessage: F.customNoOptionsMessage,
      isMandatory: !0,
      value: J
    }
  ))), fr = () => /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Select\x20Country',
      name: "dtaa-country",
      placeholder: 'Select\x20Country',
      options: fe,
      value: Ne,
      handleChange: yn,
      setIsOpen: De,
      noOptionsMessage: F.customNoOptionsMessage,
      isMandatory: !0
    }
  )), /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Select\x20DTAA\x20Type',
      name: "dtaa-type",
      placeholder: 'Select\x20DTAA\x20Type',
      options: Ze,
      value: He,
      handleChange: un,
      setIsOpen: De,
      noOptionsMessage: () => nn.dtaaCustomNoOptionsMessage(ae == null ? void 0 : ae.toLowerCase().replace("_", "-"), "country"),
      isMandatory: !0
    }
  )), /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(NS, { label: "" }, /* @__PURE__ */ l.createElement(
    Is,
    {
      label: 'Article\x20Wise',
      value: At.ARTICLE,
      isChecked: ae == At.ARTICLE,
      handleChange: () => Ot(At.ARTICLE)
    }
  ), /* @__PURE__ */ l.createElement(
    Is,
    {
      label: 'Subject\x20Wise',
      value: At.SUBJECT,
      isChecked: ae == At.SUBJECT,
      handleChange: () => Ot(At.SUBJECT)
    }
  ), /* @__PURE__ */ l.createElement(
    Is,
    {
      label: 'Full\x20Treaty',
      value: At.FULL_TREATY,
      isChecked: ae == At.FULL_TREATY,
      handleChange: () => Ot(At.FULL_TREATY)
    }
  ))), /* @__PURE__ */ l.createElement("div", { className: "form-group" }, ae && /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Select\x20Article',
      name: "dtaa-article",
      placeholder: 'Select\x20Article',
      options: yt,
      value: rt,
      handleChange: mt,
      setIsOpen: De,
      noOptionsMessage: () => nn.dtaaCustomNoOptionsMessage(ae == null ? void 0 : ae.toLowerCase().replace("_", "-"), "dtaa-type"),
      className: ae == At.ARTICLE ? "" : "d-none",
      isMandatory: !0
    }
  )), /* @__PURE__ */ l.createElement("div", { className: "form-group" }, ae && /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Select\x20Subject',
      name: "dtaa-subject",
      placeholder: 'Select\x20Subject',
      options: dt,
      value: Ue,
      handleChange: Xe,
      setIsOpen: De,
      noOptionsMessage: () => nn.dtaaCustomNoOptionsMessage(ae == null ? void 0 : ae.toLowerCase().replace("_", "-"), "dtaa-type"),
      className: ae == At.SUBJECT ? "" : "d-none",
      isMandatory: !0
    }
  )));
  return /* @__PURE__ */ l.createElement("div", { className: "d-flex h-100 justify-content-center mt-2" }, /* @__PURE__ */ l.createElement("section", { class: "sectionSelector" }, /* @__PURE__ */ l.createElement("div", { className: "search-wrapper", role: "region", "aria-label": 'Search' }, /* @__PURE__ */ l.createElement("div", { className: "search-box" }, /* @__PURE__ */ l.createElement("p", { class: "search-title text-center mb-1" }, 'Add\x20Document', /* @__PURE__ */ l.createElement(tc, { label: 'Select\x20a\x20Document\x20in\x20order\x20to\x20Compare' })), /* @__PURE__ */ l.createElement("div", { className: "contains_mandatory mb-3 mx-auto" }, /* @__PURE__ */ l.createElement("span", { className: "asterisk" }, "*"), '\x2a\x20Indicates\x20mandatory\x20fields'), /* @__PURE__ */ l.createElement("div", { className: "form-group" }, /* @__PURE__ */ l.createElement(
    Sn,
    {
      label: 'Select\x20Entity',
      name: "entity-type",
      placeholder: 'Select',
      options: i,
      value: u || null,
      handleChange: ue,
      setIsOpen: De,
      noOptionsMessage: F.customNoOptionsMessage,
      isMandatory: !0
    }
  )), (u == null ? void 0 : u.value) === a.Sections && Xt(), (u == null ? void 0 : u.value) === a.Rules && zt(), (u == null ? void 0 : u.value) === a.DTAA && fr(), /* @__PURE__ */ l.createElement("div", { class: "d-flex justify-content-center" }, /* @__PURE__ */ l.createElement("button", { className: "btn btn-outline-primary-no-hover mr-4", onClick: En }, 'Clear'), /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn btn-primary",
      onClick: et,
      disabled: ge
    },
    'View'
  ))))));
}, BT = ({
  sectionId: e,
  sectionContext: t,
  printWithFootnote: n,
  actRuleCategories: r,
  setShowChangesEnabled: a,
  showChangesEnabled: i,
  isSingleWindowViewEnabled: s
}) => {
  const [c, u] = V(t), [p, g] = V(!!(c != null && c.sectionUrl)), [v, y] = V(null), [E, L] = V(null), x = () => {
    a(!1), g(!1), y(null), L(null), u(
      (D) => {
        const k = {
          ...D,
          sectionUrl: void 0,
          sectionId: void 0,
          htmlDiff: void 0
        };
        return window.parallelViewerContextDataMap.set(e, k), k;
      }
    );
  }, C = (D) => {
    D && window.open(`/w/${D}`, "_blank");
  }, T = async () => {
    var D;
    if (!c || !(c != null && c.sectionUrl)) {
      console.debug("No URL found to get the Data"), console.warn(c);
      return;
    }
    try {
      window.showLoader();
      const k = {
        nestedFields: "embedded"
      }, N = F.createQueryString(k), A = await (await Liferay.Util.fetch(
        c == null ? void 0 : c.sectionUrl,
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      )).json(), f = A != null && A.items ? A.items[0] : A;
      if (!f) {
        console.warn("No data Found for the given Article Details");
        return;
      }
      const _ = (D = F.getValuesFromJson(f, "documentContent")) == null ? void 0 : D.data;
      if (!_ || _ == "") {
        console.debug("No Content found for the Section");
        return;
      }
      L(f), y(_), window.parallelViewerContextDataMap.get(e).articleData = f, g(!0);
    } catch (k) {
      console.error("Error fetching section Content:", k);
    } finally {
      window.hideLoader();
    }
  };
  return ye(() => {
    if (i && s) {
      console.warn("Show Changes is loade in Single Window View Mode.");
      return;
    }
    if (i && (c != null && c.htmlDiff)) {
      y(c == null ? void 0 : c.htmlDiff);
      return;
    }
    if (window.parallelViewerContextDataMap.set(e, c), !c || !(c != null && c.sectionUrl)) {
      console.warn("No URL found to get the Data");
      return;
    }
    T();
  }, [c, i]), ye(() => {
    window.parallelViewContextMap.set(e, u);
  }, []), /* @__PURE__ */ l.createElement(l.Fragment, null, !p && /* @__PURE__ */ l.createElement(
    UT,
    {
      showContent: g,
      selectedSectionContext: c,
      setSelectedSectionContext: u,
      sectionId: e
    }
  ), p && v && E && /* @__PURE__ */ l.createElement("div", { className: `sectionContentViewer ${e === "viewer-0" ? "sectionContentViewer-left-section" : "sectionContentViewer-right-section"}` }, /* @__PURE__ */ l.createElement("div", { className: "content-viewer-header d-flex justify-content-between" }, /* @__PURE__ */ l.createElement("h2", { className: "selected-chapter-section-info mb-0" }, /* @__PURE__ */ l.createElement("div", { className: "section-data text-truncate text-primary sub-heading-2-medium" }, F.getActRuleDocumentViewerTitle(E, r).title)), /* @__PURE__ */ l.createElement("div", { className: "actions-wrap" }, /* @__PURE__ */ l.createElement(lc, { variant: "primary", onClick: x, className: "change-section" }, /* @__PURE__ */ l.createElement("span", { className: "sr-only" }, F.getActRuleDocumentViewerTitle(E, r).title), 'Change'), /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn reset-btn-style btn-open-in-new-tab text-primary",
      onClick: (D) => {
        var N;
        D.stopPropagation();
        const k = (E == null ? void 0 : E.friendlyUrlPath) || ((N = c == null ? void 0 : c.articleData) == null ? void 0 : N.friendlyUrlPath);
        C(k);
      },
      "aria-label": 'Open\x20in\x20new\x20tab'
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-open-in-new-tab-lg" })
  ))), /* @__PURE__ */ l.createElement(
    "div",
    {
      dangerouslySetInnerHTML: { __html: v },
      className: `taglib-diff-html selected-section-content doc-view-content-main ${n && "print-with-footnote"}`,
      "aria-label": 'Section\x20Content'
    }
  ), /* @__PURE__ */ l.createElement(rc, null)));
}, ZD = ({ isSingleWindowViewEnabled: e = !1, isShowChangesEnabled: t = !1 }) => {
  var A;
  window.currentSourceDivId = null;
  const [n, r] = V(!1), { observer: a, onClose: i } = Br({
    onClose: () => {
      r(!1), window.parallelViewerContextDataMap.clear();
    }
  }), s = () => r(!0), [c, u] = V([]), [p, g] = V(!1), v = _e(null), [y, E] = V(null), [L, x] = V(!1), [C, T] = V(!1), D = (f = []) => {
    x(!1), u(f), T(t), s();
  }, k = (f) => {
    const O = f.target.closest("div.selected-content-viewer");
    !O || !O.id || (window.currentSourceDivId = O.id, console.debug("Source Div ID captured:", window.currentSourceDivId));
  }, N = (f, _, O, J) => {
    var ie;
    console.debug("Current Clicked Div: " + window.currentSourceDivId);
    const ee = `${Liferay.ThemeDisplay.getPortalURL()}/o/headless-delivery/v1.0/sites/${Liferay.ThemeDisplay.getScopeGroupId()}/structured-contents?page=1&pageSize=1&flatten=true&${"search=" + O}`, ge = (ie = window.parallelViewContextMap) == null ? void 0 : ie.get(window.currentSourceDivId);
    typeof ge == "function" ? ge((fe) => ({
      ...fe,
      sectionUrl: ee,
      sectionId: O
    })) : console.debug(`No valid function found for key: ${window.currentSourceDivId}`);
  }, R = async () => {
    var f, _;
    if (L) {
      x(!1);
      return;
    }
    try {
      const O = Array.from(window.parallelViewerContextDataMap.values());
      if (O.length < 2) {
        console.warn("At least two entries are needed for comparison.");
        return;
      }
      if (e && c.length === 2) {
        console.debug("Single Window View is Enabled - Using Single Window View for Show Changes"), window.showContentComparisonViewer(O, y, r);
        return;
      } else e && c.length === 3 && (console.debug("Double Window View is Enabled for DTAA - Using Single Window View for Show Changes"), window.showDTAAContentComparisonViewer(O, y, r));
      window.showLoader();
      const J = Liferay.ThemeDisplay.getScopeGroupId(), ee = Number((f = O[0].articleData) == null ? void 0 : f.key), ge = Number((_ = O[1].articleData) == null ? void 0 : _.key), ie = await Liferay.Util.fetch(
        `${Liferay.ThemeDisplay.getPortalURL()}/o/web-content-diff/sites/${J}/web-contents/${ee}/compare/${ge}`,
        {
          method: "GET",
          headers: {
            "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
          }
        }
      ).then((fe) => fe.json());
      if (!ie || !ie.htmlDiff) {
        console.error("Unable to get the HTMl Diff...."), window.hideLoader();
        return;
      }
      window.parallelViewerContextDataMap.get("viewer-0").htmlDiff = ie.htmlDiff, window.parallelViewerContextDataMap.get("viewer-1").htmlDiff = ie.htmlDiff, x(!0);
    } catch (O) {
      console.debug(O), window.hideLoader();
    }
    window.hideLoader();
  };
  return ye(() => {
    $(document).on("click", "a", k), window.startParallelViewer = D, window.updateParallelViewerContent = N, window.parallelViewContextMap = /* @__PURE__ */ new Map(), window.parallelViewerContextDataMap = /* @__PURE__ */ new Map(), window.setShowChangesEnabled = x, window.setIsParallelViewerOpen = r;
  }, []), ye(() => {
    n || (window.currentSourceDivId = ""), n && !y && (async () => {
      try {
        window.showLoader();
        const f = await F.fetchRelatedContentCategories(["Act", "Rule"]);
        E(f);
      } catch (f) {
        console.error("Error fetching Act and Rule categories:", f);
      } finally {
        window.hideLoader();
      }
    })();
  }, [n]), /* @__PURE__ */ l.createElement(l.Fragment, null, n && /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(hn, { observer: a, size: "xl", className: "document-viewer-modal parallel-viewer-modal" }, /* @__PURE__ */ l.createElement("div", { "aria-live": "assertive", className: "sr-only" }, 'Parallel\x20viewer\x20popup\x20opened', "."), /* @__PURE__ */ l.createElement(hn.Body, { className: "p-0" }, /* @__PURE__ */ l.createElement("div", { className: "document-viewer-wrapper parallel-reading" }, /* @__PURE__ */ l.createElement("div", { className: "doc-view-sidebar collapsed" }, /* @__PURE__ */ l.createElement(To, { handleSidebarClick: F.handleDocumentViewerSidebarClick }), /* @__PURE__ */ l.createElement(ko, null, /* @__PURE__ */ l.createElement(
    Do,
    {
      printWithFootnote: p,
      setPrintWithFootnote: g,
      docViewContentId: "parallerViewerContent",
      printFrameRef: v
    }
  ))), /* @__PURE__ */ l.createElement("div", { className: "doc-view-section collapsed" }, /* @__PURE__ */ l.createElement("div", { className: "doc-view-content-area" }, /* @__PURE__ */ l.createElement("div", { class: "doc-view-tabs nav nav-tabs pr-1" }, /* @__PURE__ */ l.createElement("p", { className: "nav-item nav-link active" }, ((A = c == null ? void 0 : c[0]) == null ? void 0 : A.entityName) == "DTAA" ? 'Treaty\x20Comparison' : 'Parallel\x20Reading'), C && /* @__PURE__ */ l.createElement("label", { className: "form-check-label etds-check-box show-changes-wrap", htmlFor: "showChanges" }, /* @__PURE__ */ l.createElement(
    "input",
    {
      type: "checkbox",
      id: "showChanges",
      checked: L,
      onClick: R,
      className: "custom-checkbox-input"
    }
  ), /* @__PURE__ */ l.createElement("span", { className: "label-text" }, 'Show\x20Changes'), /* @__PURE__ */ l.createElement(tc, { label: 'Highlights\x20the\x20changes\x20between\x20document\x20versions\x20based\x20on\x20available\x20data\x2e' }))), /* @__PURE__ */ l.createElement(
    "button",
    {
      className: "btn reset-btn-style close-doc-view-modal",
      onClick: i,
      "aria-label": 'Close\x20Popup'
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-close" })
  ), /* @__PURE__ */ l.createElement("div", { className: `parallel-viewer-content-container d-flex item-count-${c.length}`, id: "parallerViewerContent" }, /* @__PURE__ */ l.createElement("span", { className: "sr-only", id: "footnote-aria-live", "aria-live": "assertive", "aria-atomic": "true" }), c.map((f, _) => /* @__PURE__ */ l.createElement(
    "div",
    {
      key: _,
      "data-key": _,
      id: `viewer-${_}`,
      class: `col-${12 / c.length} px-1 selected-content-viewer mb-4 html-content-viewer`
    },
    /* @__PURE__ */ l.createElement(
      BT,
      {
        sectionId: `viewer-${_}`,
        sectionContext: f,
        printWithFootnote: p,
        actRuleCategories: y,
        setShowChangesEnabled: x,
        showChangesEnabled: L,
        isSingleWindowViewEnabled: e
      }
    )
  )))))), /* @__PURE__ */ l.createElement("span", { tabIndex: "0", "aria-hidden": "true", onFocus: () => {
    var f;
    return (f = document.querySelector("#sidebar-modal-btn")) == null ? void 0 : f.focus();
  } })))));
};
var zp = { exports: {} };
/*!
 * jQuery JavaScript Library v3.7.1
 * https://jquery.com/
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2023-08-28T13:37Z
 */
(function(e) {
  (function(t, n) {
    e.exports = t.document ? n(t, !0) : function(r) {
      if (!r.document)
        throw new Error("jQuery requires a window with a document");
      return n(r);
    };
  })(typeof window < "u" ? window : tb, function(t, n) {
    var r = [], a = Object.getPrototypeOf, i = r.slice, s = r.flat ? function(o) {
      return r.flat.call(o);
    } : function(o) {
      return r.concat.apply([], o);
    }, c = r.push, u = r.indexOf, p = {}, g = p.toString, v = p.hasOwnProperty, y = v.toString, E = y.call(Object), L = {}, x = function(d) {
      return typeof d == "function" && typeof d.nodeType != "number" && typeof d.item != "function";
    }, C = function(d) {
      return d != null && d === d.window;
    }, T = t.document, D = {
      type: !0,
      src: !0,
      nonce: !0,
      noModule: !0
    };
    function k(o, d, m) {
      m = m || T;
      var h, b, w = m.createElement("script");
      if (w.text = o, d)
        for (h in D)
          b = d[h] || d.getAttribute && d.getAttribute(h), b && w.setAttribute(h, b);
      m.head.appendChild(w).parentNode.removeChild(w);
    }
    function N(o) {
      return o == null ? o + "" : typeof o == "object" || typeof o == "function" ? p[g.call(o)] || "object" : typeof o;
    }
    var R = "3.7.1", A = /HTML$/i, f = function(o, d) {
      return new f.fn.init(o, d);
    };
    f.fn = f.prototype = {
      // The current version of jQuery being used
      jquery: R,
      constructor: f,
      // The default length of a jQuery object is 0
      length: 0,
      toArray: function() {
        return i.call(this);
      },
      // Get the Nth element in the matched element set OR
      // Get the whole matched element set as a clean array
      get: function(o) {
        return o == null ? i.call(this) : o < 0 ? this[o + this.length] : this[o];
      },
      // Take an array of elements and push it onto the stack
      // (returning the new matched element set)
      pushStack: function(o) {
        var d = f.merge(this.constructor(), o);
        return d.prevObject = this, d;
      },
      // Execute a callback for every element in the matched set.
      each: function(o) {
        return f.each(this, o);
      },
      map: function(o) {
        return this.pushStack(f.map(this, function(d, m) {
          return o.call(d, m, d);
        }));
      },
      slice: function() {
        return this.pushStack(i.apply(this, arguments));
      },
      first: function() {
        return this.eq(0);
      },
      last: function() {
        return this.eq(-1);
      },
      even: function() {
        return this.pushStack(f.grep(this, function(o, d) {
          return (d + 1) % 2;
        }));
      },
      odd: function() {
        return this.pushStack(f.grep(this, function(o, d) {
          return d % 2;
        }));
      },
      eq: function(o) {
        var d = this.length, m = +o + (o < 0 ? d : 0);
        return this.pushStack(m >= 0 && m < d ? [this[m]] : []);
      },
      end: function() {
        return this.prevObject || this.constructor();
      },
      // For internal use only.
      // Behaves like an Array's method, not like a jQuery method.
      push: c,
      sort: r.sort,
      splice: r.splice
    }, f.extend = f.fn.extend = function() {
      var o, d, m, h, b, w, S = arguments[0] || {}, M = 1, I = arguments.length, B = !1;
      for (typeof S == "boolean" && (B = S, S = arguments[M] || {}, M++), typeof S != "object" && !x(S) && (S = {}), M === I && (S = this, M--); M < I; M++)
        if ((o = arguments[M]) != null)
          for (d in o)
            h = o[d], !(d === "__proto__" || S === h) && (B && h && (f.isPlainObject(h) || (b = Array.isArray(h))) ? (m = S[d], b && !Array.isArray(m) ? w = [] : !b && !f.isPlainObject(m) ? w = {} : w = m, b = !1, S[d] = f.extend(B, w, h)) : h !== void 0 && (S[d] = h));
      return S;
    }, f.extend({
      // Unique for each copy of jQuery on the page
      expando: "jQuery" + (R + Math.random()).replace(/\D/g, ""),
      // Assume jQuery is ready without the ready module
      isReady: !0,
      error: function(o) {
        throw new Error(o);
      },
      noop: function() {
      },
      isPlainObject: function(o) {
        var d, m;
        return !o || g.call(o) !== "[object Object]" ? !1 : (d = a(o), d ? (m = v.call(d, "constructor") && d.constructor, typeof m == "function" && y.call(m) === E) : !0);
      },
      isEmptyObject: function(o) {
        var d;
        for (d in o)
          return !1;
        return !0;
      },
      // Evaluates a script in a provided context; falls back to the global one
      // if not specified.
      globalEval: function(o, d, m) {
        k(o, { nonce: d && d.nonce }, m);
      },
      each: function(o, d) {
        var m, h = 0;
        if (_(o))
          for (m = o.length; h < m && d.call(o[h], h, o[h]) !== !1; h++)
            ;
        else
          for (h in o)
            if (d.call(o[h], h, o[h]) === !1)
              break;
        return o;
      },
      // Retrieve the text value of an array of DOM nodes
      text: function(o) {
        var d, m = "", h = 0, b = o.nodeType;
        if (!b)
          for (; d = o[h++]; )
            m += f.text(d);
        return b === 1 || b === 11 ? o.textContent : b === 9 ? o.documentElement.textContent : b === 3 || b === 4 ? o.nodeValue : m;
      },
      // results is for internal usage only
      makeArray: function(o, d) {
        var m = d || [];
        return o != null && (_(Object(o)) ? f.merge(
          m,
          typeof o == "string" ? [o] : o
        ) : c.call(m, o)), m;
      },
      inArray: function(o, d, m) {
        return d == null ? -1 : u.call(d, o, m);
      },
      isXMLDoc: function(o) {
        var d = o && o.namespaceURI, m = o && (o.ownerDocument || o).documentElement;
        return !A.test(d || m && m.nodeName || "HTML");
      },
      // Support: Android <=4.0 only, PhantomJS 1 only
      // push.apply(_, arraylike) throws on ancient WebKit
      merge: function(o, d) {
        for (var m = +d.length, h = 0, b = o.length; h < m; h++)
          o[b++] = d[h];
        return o.length = b, o;
      },
      grep: function(o, d, m) {
        for (var h, b = [], w = 0, S = o.length, M = !m; w < S; w++)
          h = !d(o[w], w), h !== M && b.push(o[w]);
        return b;
      },
      // arg is for internal usage only
      map: function(o, d, m) {
        var h, b, w = 0, S = [];
        if (_(o))
          for (h = o.length; w < h; w++)
            b = d(o[w], w, m), b != null && S.push(b);
        else
          for (w in o)
            b = d(o[w], w, m), b != null && S.push(b);
        return s(S);
      },
      // A global GUID counter for objects
      guid: 1,
      // jQuery.support is not used in Core but other projects attach their
      // properties to it so it needs to exist.
      support: L
    }), typeof Symbol == "function" && (f.fn[Symbol.iterator] = r[Symbol.iterator]), f.each(
      "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),
      function(o, d) {
        p["[object " + d + "]"] = d.toLowerCase();
      }
    );
    function _(o) {
      var d = !!o && "length" in o && o.length, m = N(o);
      return x(o) || C(o) ? !1 : m === "array" || d === 0 || typeof d == "number" && d > 0 && d - 1 in o;
    }
    function O(o, d) {
      return o.nodeName && o.nodeName.toLowerCase() === d.toLowerCase();
    }
    var J = r.pop, ee = r.sort, ge = r.splice, ie = "[\\x20\\t\\r\\n\\f]", fe = new RegExp(
      "^" + ie + "+|((?:^|[^\\\\])(?:\\\\.)*)" + ie + "+$",
      "g"
    );
    f.contains = function(o, d) {
      var m = d && d.parentNode;
      return o === m || !!(m && m.nodeType === 1 && // Support: IE 9 - 11+
      // IE doesn't have `contains` on SVG.
      (o.contains ? o.contains(m) : o.compareDocumentPosition && o.compareDocumentPosition(m) & 16));
    };
    var be = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;
    function $e(o, d) {
      return d ? o === "\0" ? "�" : o.slice(0, -1) + "\\" + o.charCodeAt(o.length - 1).toString(16) + " " : "\\" + o;
    }
    f.escapeSelector = function(o) {
      return (o + "").replace(be, $e);
    };
    var Se = T, xe = c;
    (function() {
      var o, d, m, h, b, w = xe, S, M, I, B, Y, Q = f.expando, z = 0, ce = 0, Je = si(), pt = si(), it = si(), ln = si(), tn = function(P, j) {
        return P === j && (b = !0), 0;
      }, Hn = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", zn = "(?:\\\\[\\da-fA-F]{1,6}" + ie + "?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+", ut = "\\[" + ie + "*(" + zn + ")(?:" + ie + // Operator (capture 2)
      "*([*^$|!~]?=)" + ie + // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
      `*(?:'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"|(` + zn + "))|)" + ie + "*\\]", Rr = ":(" + zn + `)(?:\\((('((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)")|((?:\\\\.|[^\\\\()[\\]]|` + ut + ")*)|.*)\\)|)", ht = new RegExp(ie + "+", "g"), Vt = new RegExp("^" + ie + "*," + ie + "*"), ka = new RegExp("^" + ie + "*([>+~]|" + ie + ")" + ie + "*"), zo = new RegExp(ie + "|>"), qn = new RegExp(Rr), Pa = new RegExp("^" + zn + "$"), Wn = {
        ID: new RegExp("^#(" + zn + ")"),
        CLASS: new RegExp("^\\.(" + zn + ")"),
        TAG: new RegExp("^(" + zn + "|[*])"),
        ATTR: new RegExp("^" + ut),
        PSEUDO: new RegExp("^" + Rr),
        CHILD: new RegExp(
          "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + ie + "*(even|odd|(([+-]|)(\\d*)n|)" + ie + "*(?:([+-]|)" + ie + "*(\\d+)|))" + ie + "*\\)|)",
          "i"
        ),
        bool: new RegExp("^(?:" + Hn + ")$", "i"),
        // For use in libraries implementing .is()
        // We use this for POS matching in `select`
        needsContext: new RegExp("^" + ie + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + ie + "*((?:-\\d)?\\d*)" + ie + "*\\)|)(?=[^-]|$)", "i")
      }, gr = /^(?:input|select|textarea|button)$/i, hr = /^h\d$/i, An = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, qo = /[+~]/, ir = new RegExp("\\\\[\\da-fA-F]{1,6}" + ie + "?|\\\\([^\\r\\n\\f])", "g"), or = function(P, j) {
        var H = "0x" + P.slice(1) - 65536;
        return j || (H < 0 ? String.fromCharCode(H + 65536) : String.fromCharCode(H >> 10 | 55296, H & 1023 | 56320));
      }, am = function() {
        vr();
      }, im = ci(
        function(P) {
          return P.disabled === !0 && O(P, "fieldset");
        },
        { dir: "parentNode", next: "legend" }
      );
      function om() {
        try {
          return S.activeElement;
        } catch {
        }
      }
      try {
        w.apply(
          r = i.call(Se.childNodes),
          Se.childNodes
        ), r[Se.childNodes.length].nodeType;
      } catch {
        w = {
          apply: function(j, H) {
            xe.apply(j, i.call(H));
          },
          call: function(j) {
            xe.apply(j, i.call(arguments, 1));
          }
        };
      }
      function Dt(P, j, H, W) {
        var K, pe, Ee, Ae, Le, st, Ke, Qe = j && j.ownerDocument, lt = j ? j.nodeType : 9;
        if (H = H || [], typeof P != "string" || !P || lt !== 1 && lt !== 9 && lt !== 11)
          return H;
        if (!W && (vr(j), j = j || S, I)) {
          if (lt !== 11 && (Le = An.exec(P)))
            if (K = Le[1]) {
              if (lt === 9)
                if (Ee = j.getElementById(K)) {
                  if (Ee.id === K)
                    return w.call(H, Ee), H;
                } else
                  return H;
              else if (Qe && (Ee = Qe.getElementById(K)) && Dt.contains(j, Ee) && Ee.id === K)
                return w.call(H, Ee), H;
            } else {
              if (Le[2])
                return w.apply(H, j.getElementsByTagName(P)), H;
              if ((K = Le[3]) && j.getElementsByClassName)
                return w.apply(H, j.getElementsByClassName(K)), H;
            }
          if (!ln[P + " "] && (!B || !B.test(P))) {
            if (Ke = P, Qe = j, lt === 1 && (zo.test(P) || ka.test(P))) {
              for (Qe = qo.test(P) && Wo(j.parentNode) || j, (Qe != j || !L.scope) && ((Ae = j.getAttribute("id")) ? Ae = f.escapeSelector(Ae) : j.setAttribute("id", Ae = Q)), st = Na(P), pe = st.length; pe--; )
                st[pe] = (Ae ? "#" + Ae : ":scope") + " " + li(st[pe]);
              Ke = st.join(",");
            }
            try {
              return w.apply(
                H,
                Qe.querySelectorAll(Ke)
              ), H;
            } catch {
              ln(P, !0);
            } finally {
              Ae === Q && j.removeAttribute("id");
            }
          }
        }
        return bc(P.replace(fe, "$1"), j, H, W);
      }
      function si() {
        var P = [];
        function j(H, W) {
          return P.push(H + " ") > d.cacheLength && delete j[P.shift()], j[H + " "] = W;
        }
        return j;
      }
      function jn(P) {
        return P[Q] = !0, P;
      }
      function Jr(P) {
        var j = S.createElement("fieldset");
        try {
          return !!P(j);
        } catch {
          return !1;
        } finally {
          j.parentNode && j.parentNode.removeChild(j), j = null;
        }
      }
      function sm(P) {
        return function(j) {
          return O(j, "input") && j.type === P;
        };
      }
      function lm(P) {
        return function(j) {
          return (O(j, "input") || O(j, "button")) && j.type === P;
        };
      }
      function vc(P) {
        return function(j) {
          return "form" in j ? j.parentNode && j.disabled === !1 ? "label" in j ? "label" in j.parentNode ? j.parentNode.disabled === P : j.disabled === P : j.isDisabled === P || // Where there is no isDisabled, check manually
          j.isDisabled !== !P && im(j) === P : j.disabled === P : "label" in j ? j.disabled === P : !1;
        };
      }
      function Ir(P) {
        return jn(function(j) {
          return j = +j, jn(function(H, W) {
            for (var K, pe = P([], H.length, j), Ee = pe.length; Ee--; )
              H[K = pe[Ee]] && (H[K] = !(W[K] = H[K]));
          });
        });
      }
      function Wo(P) {
        return P && typeof P.getElementsByTagName < "u" && P;
      }
      function vr(P) {
        var j, H = P ? P.ownerDocument || P : Se;
        return H == S || H.nodeType !== 9 || !H.documentElement || (S = H, M = S.documentElement, I = !f.isXMLDoc(S), Y = M.matches || M.webkitMatchesSelector || M.msMatchesSelector, M.msMatchesSelector && // Support: IE 11+, Edge 17 - 18+
        // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
        // two documents; shallow comparisons work.
        // eslint-disable-next-line eqeqeq
        Se != S && (j = S.defaultView) && j.top !== j && j.addEventListener("unload", am), L.getById = Jr(function(W) {
          return M.appendChild(W).id = f.expando, !S.getElementsByName || !S.getElementsByName(f.expando).length;
        }), L.disconnectedMatch = Jr(function(W) {
          return Y.call(W, "*");
        }), L.scope = Jr(function() {
          return S.querySelectorAll(":scope");
        }), L.cssHas = Jr(function() {
          try {
            return S.querySelector(":has(*,:jqfake)"), !1;
          } catch {
            return !0;
          }
        }), L.getById ? (d.filter.ID = function(W) {
          var K = W.replace(ir, or);
          return function(pe) {
            return pe.getAttribute("id") === K;
          };
        }, d.find.ID = function(W, K) {
          if (typeof K.getElementById < "u" && I) {
            var pe = K.getElementById(W);
            return pe ? [pe] : [];
          }
        }) : (d.filter.ID = function(W) {
          var K = W.replace(ir, or);
          return function(pe) {
            var Ee = typeof pe.getAttributeNode < "u" && pe.getAttributeNode("id");
            return Ee && Ee.value === K;
          };
        }, d.find.ID = function(W, K) {
          if (typeof K.getElementById < "u" && I) {
            var pe, Ee, Ae, Le = K.getElementById(W);
            if (Le) {
              if (pe = Le.getAttributeNode("id"), pe && pe.value === W)
                return [Le];
              for (Ae = K.getElementsByName(W), Ee = 0; Le = Ae[Ee++]; )
                if (pe = Le.getAttributeNode("id"), pe && pe.value === W)
                  return [Le];
            }
            return [];
          }
        }), d.find.TAG = function(W, K) {
          return typeof K.getElementsByTagName < "u" ? K.getElementsByTagName(W) : K.querySelectorAll(W);
        }, d.find.CLASS = function(W, K) {
          if (typeof K.getElementsByClassName < "u" && I)
            return K.getElementsByClassName(W);
        }, B = [], Jr(function(W) {
          var K;
          M.appendChild(W).innerHTML = "<a id='" + Q + "' href='' disabled='disabled'></a><select id='" + Q + "-\r\\' disabled='disabled'><option selected=''></option></select>", W.querySelectorAll("[selected]").length || B.push("\\[" + ie + "*(?:value|" + Hn + ")"), W.querySelectorAll("[id~=" + Q + "-]").length || B.push("~="), W.querySelectorAll("a#" + Q + "+*").length || B.push(".#.+[+~]"), W.querySelectorAll(":checked").length || B.push(":checked"), K = S.createElement("input"), K.setAttribute("type", "hidden"), W.appendChild(K).setAttribute("name", "D"), M.appendChild(W).disabled = !0, W.querySelectorAll(":disabled").length !== 2 && B.push(":enabled", ":disabled"), K = S.createElement("input"), K.setAttribute("name", ""), W.appendChild(K), W.querySelectorAll("[name='']").length || B.push("\\[" + ie + "*name" + ie + "*=" + ie + `*(?:''|"")`);
        }), L.cssHas || B.push(":has"), B = B.length && new RegExp(B.join("|")), tn = function(W, K) {
          if (W === K)
            return b = !0, 0;
          var pe = !W.compareDocumentPosition - !K.compareDocumentPosition;
          return pe || (pe = (W.ownerDocument || W) == (K.ownerDocument || K) ? W.compareDocumentPosition(K) : (
            // Otherwise we know they are disconnected
            1
          ), pe & 1 || !L.sortDetached && K.compareDocumentPosition(W) === pe ? W === S || W.ownerDocument == Se && Dt.contains(Se, W) ? -1 : K === S || K.ownerDocument == Se && Dt.contains(Se, K) ? 1 : h ? u.call(h, W) - u.call(h, K) : 0 : pe & 4 ? -1 : 1);
        }), S;
      }
      Dt.matches = function(P, j) {
        return Dt(P, null, null, j);
      }, Dt.matchesSelector = function(P, j) {
        if (vr(P), I && !ln[j + " "] && (!B || !B.test(j)))
          try {
            var H = Y.call(P, j);
            if (H || L.disconnectedMatch || // As well, disconnected nodes are said to be in a document
            // fragment in IE 9
            P.document && P.document.nodeType !== 11)
              return H;
          } catch {
            ln(j, !0);
          }
        return Dt(j, S, null, [P]).length > 0;
      }, Dt.contains = function(P, j) {
        return (P.ownerDocument || P) != S && vr(P), f.contains(P, j);
      }, Dt.attr = function(P, j) {
        (P.ownerDocument || P) != S && vr(P);
        var H = d.attrHandle[j.toLowerCase()], W = H && v.call(d.attrHandle, j.toLowerCase()) ? H(P, j, !I) : void 0;
        return W !== void 0 ? W : P.getAttribute(j);
      }, Dt.error = function(P) {
        throw new Error("Syntax error, unrecognized expression: " + P);
      }, f.uniqueSort = function(P) {
        var j, H = [], W = 0, K = 0;
        if (b = !L.sortStable, h = !L.sortStable && i.call(P, 0), ee.call(P, tn), b) {
          for (; j = P[K++]; )
            j === P[K] && (W = H.push(K));
          for (; W--; )
            ge.call(P, H[W], 1);
        }
        return h = null, P;
      }, f.fn.uniqueSort = function() {
        return this.pushStack(f.uniqueSort(i.apply(this)));
      }, d = f.expr = {
        // Can be adjusted by the user
        cacheLength: 50,
        createPseudo: jn,
        match: Wn,
        attrHandle: {},
        find: {},
        relative: {
          ">": { dir: "parentNode", first: !0 },
          " ": { dir: "parentNode" },
          "+": { dir: "previousSibling", first: !0 },
          "~": { dir: "previousSibling" }
        },
        preFilter: {
          ATTR: function(P) {
            return P[1] = P[1].replace(ir, or), P[3] = (P[3] || P[4] || P[5] || "").replace(ir, or), P[2] === "~=" && (P[3] = " " + P[3] + " "), P.slice(0, 4);
          },
          CHILD: function(P) {
            return P[1] = P[1].toLowerCase(), P[1].slice(0, 3) === "nth" ? (P[3] || Dt.error(P[0]), P[4] = +(P[4] ? P[5] + (P[6] || 1) : 2 * (P[3] === "even" || P[3] === "odd")), P[5] = +(P[7] + P[8] || P[3] === "odd")) : P[3] && Dt.error(P[0]), P;
          },
          PSEUDO: function(P) {
            var j, H = !P[6] && P[2];
            return Wn.CHILD.test(P[0]) ? null : (P[3] ? P[2] = P[4] || P[5] || "" : H && qn.test(H) && // Get excess from tokenize (recursively)
            (j = Na(H, !0)) && // advance to the next closing parenthesis
            (j = H.indexOf(")", H.length - j) - H.length) && (P[0] = P[0].slice(0, j), P[2] = H.slice(0, j)), P.slice(0, 3));
          }
        },
        filter: {
          TAG: function(P) {
            var j = P.replace(ir, or).toLowerCase();
            return P === "*" ? function() {
              return !0;
            } : function(H) {
              return O(H, j);
            };
          },
          CLASS: function(P) {
            var j = Je[P + " "];
            return j || (j = new RegExp("(^|" + ie + ")" + P + "(" + ie + "|$)")) && Je(P, function(H) {
              return j.test(
                typeof H.className == "string" && H.className || typeof H.getAttribute < "u" && H.getAttribute("class") || ""
              );
            });
          },
          ATTR: function(P, j, H) {
            return function(W) {
              var K = Dt.attr(W, P);
              return K == null ? j === "!=" : j ? (K += "", j === "=" ? K === H : j === "!=" ? K !== H : j === "^=" ? H && K.indexOf(H) === 0 : j === "*=" ? H && K.indexOf(H) > -1 : j === "$=" ? H && K.slice(-H.length) === H : j === "~=" ? (" " + K.replace(ht, " ") + " ").indexOf(H) > -1 : j === "|=" ? K === H || K.slice(0, H.length + 1) === H + "-" : !1) : !0;
            };
          },
          CHILD: function(P, j, H, W, K) {
            var pe = P.slice(0, 3) !== "nth", Ee = P.slice(-4) !== "last", Ae = j === "of-type";
            return W === 1 && K === 0 ? (
              // Shortcut for :nth-*(n)
              function(Le) {
                return !!Le.parentNode;
              }
            ) : function(Le, st, Ke) {
              var Qe, lt, ze, It, Cn, mn = pe !== Ee ? "nextSibling" : "previousSibling", On = Le.parentNode, Yn = Ae && Le.nodeName.toLowerCase(), Qr = !Ke && !Ae, xn = !1;
              if (On) {
                if (pe) {
                  for (; mn; ) {
                    for (ze = Le; ze = ze[mn]; )
                      if (Ae ? O(ze, Yn) : ze.nodeType === 1)
                        return !1;
                    Cn = mn = P === "only" && !Cn && "nextSibling";
                  }
                  return !0;
                }
                if (Cn = [Ee ? On.firstChild : On.lastChild], Ee && Qr) {
                  for (lt = On[Q] || (On[Q] = {}), Qe = lt[P] || [], It = Qe[0] === z && Qe[1], xn = It && Qe[2], ze = It && On.childNodes[It]; ze = ++It && ze && ze[mn] || // Fallback to seeking `elem` from the start
                  (xn = It = 0) || Cn.pop(); )
                    if (ze.nodeType === 1 && ++xn && ze === Le) {
                      lt[P] = [z, It, xn];
                      break;
                    }
                } else if (Qr && (lt = Le[Q] || (Le[Q] = {}), Qe = lt[P] || [], It = Qe[0] === z && Qe[1], xn = It), xn === !1)
                  for (; (ze = ++It && ze && ze[mn] || (xn = It = 0) || Cn.pop()) && !((Ae ? O(ze, Yn) : ze.nodeType === 1) && ++xn && (Qr && (lt = ze[Q] || (ze[Q] = {}), lt[P] = [z, xn]), ze === Le)); )
                    ;
                return xn -= K, xn === W || xn % W === 0 && xn / W >= 0;
              }
            };
          },
          PSEUDO: function(P, j) {
            var H, W = d.pseudos[P] || d.setFilters[P.toLowerCase()] || Dt.error("unsupported pseudo: " + P);
            return W[Q] ? W(j) : W.length > 1 ? (H = [P, P, "", j], d.setFilters.hasOwnProperty(P.toLowerCase()) ? jn(function(K, pe) {
              for (var Ee, Ae = W(K, j), Le = Ae.length; Le--; )
                Ee = u.call(K, Ae[Le]), K[Ee] = !(pe[Ee] = Ae[Le]);
            }) : function(K) {
              return W(K, 0, H);
            }) : W;
          }
        },
        pseudos: {
          // Potentially complex pseudos
          not: jn(function(P) {
            var j = [], H = [], W = Jo(P.replace(fe, "$1"));
            return W[Q] ? jn(function(K, pe, Ee, Ae) {
              for (var Le, st = W(K, null, Ae, []), Ke = K.length; Ke--; )
                (Le = st[Ke]) && (K[Ke] = !(pe[Ke] = Le));
            }) : function(K, pe, Ee) {
              return j[0] = K, W(j, null, Ee, H), j[0] = null, !H.pop();
            };
          }),
          has: jn(function(P) {
            return function(j) {
              return Dt(P, j).length > 0;
            };
          }),
          contains: jn(function(P) {
            return P = P.replace(ir, or), function(j) {
              return (j.textContent || f.text(j)).indexOf(P) > -1;
            };
          }),
          // "Whether an element is represented by a :lang() selector
          // is based solely on the element's language value
          // being equal to the identifier C,
          // or beginning with the identifier C immediately followed by "-".
          // The matching of C against the element's language value is performed case-insensitively.
          // The identifier C does not have to be a valid language name."
          // https://www.w3.org/TR/selectors/#lang-pseudo
          lang: jn(function(P) {
            return Pa.test(P || "") || Dt.error("unsupported lang: " + P), P = P.replace(ir, or).toLowerCase(), function(j) {
              var H;
              do
                if (H = I ? j.lang : j.getAttribute("xml:lang") || j.getAttribute("lang"))
                  return H = H.toLowerCase(), H === P || H.indexOf(P + "-") === 0;
              while ((j = j.parentNode) && j.nodeType === 1);
              return !1;
            };
          }),
          // Miscellaneous
          target: function(P) {
            var j = t.location && t.location.hash;
            return j && j.slice(1) === P.id;
          },
          root: function(P) {
            return P === M;
          },
          focus: function(P) {
            return P === om() && S.hasFocus() && !!(P.type || P.href || ~P.tabIndex);
          },
          // Boolean properties
          enabled: vc(!1),
          disabled: vc(!0),
          checked: function(P) {
            return O(P, "input") && !!P.checked || O(P, "option") && !!P.selected;
          },
          selected: function(P) {
            return P.parentNode && P.parentNode.selectedIndex, P.selected === !0;
          },
          // Contents
          empty: function(P) {
            for (P = P.firstChild; P; P = P.nextSibling)
              if (P.nodeType < 6)
                return !1;
            return !0;
          },
          parent: function(P) {
            return !d.pseudos.empty(P);
          },
          // Element/input types
          header: function(P) {
            return hr.test(P.nodeName);
          },
          input: function(P) {
            return gr.test(P.nodeName);
          },
          button: function(P) {
            return O(P, "input") && P.type === "button" || O(P, "button");
          },
          text: function(P) {
            var j;
            return O(P, "input") && P.type === "text" && // Support: IE <10 only
            // New HTML5 attribute values (e.g., "search") appear
            // with elem.type === "text"
            ((j = P.getAttribute("type")) == null || j.toLowerCase() === "text");
          },
          // Position-in-collection
          first: Ir(function() {
            return [0];
          }),
          last: Ir(function(P, j) {
            return [j - 1];
          }),
          eq: Ir(function(P, j, H) {
            return [H < 0 ? H + j : H];
          }),
          even: Ir(function(P, j) {
            for (var H = 0; H < j; H += 2)
              P.push(H);
            return P;
          }),
          odd: Ir(function(P, j) {
            for (var H = 1; H < j; H += 2)
              P.push(H);
            return P;
          }),
          lt: Ir(function(P, j, H) {
            var W;
            for (H < 0 ? W = H + j : H > j ? W = j : W = H; --W >= 0; )
              P.push(W);
            return P;
          }),
          gt: Ir(function(P, j, H) {
            for (var W = H < 0 ? H + j : H; ++W < j; )
              P.push(W);
            return P;
          })
        }
      }, d.pseudos.nth = d.pseudos.eq;
      for (o in { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 })
        d.pseudos[o] = sm(o);
      for (o in { submit: !0, reset: !0 })
        d.pseudos[o] = lm(o);
      function yc() {
      }
      yc.prototype = d.filters = d.pseudos, d.setFilters = new yc();
      function Na(P, j) {
        var H, W, K, pe, Ee, Ae, Le, st = pt[P + " "];
        if (st)
          return j ? 0 : st.slice(0);
        for (Ee = P, Ae = [], Le = d.preFilter; Ee; ) {
          (!H || (W = Vt.exec(Ee))) && (W && (Ee = Ee.slice(W[0].length) || Ee), Ae.push(K = [])), H = !1, (W = ka.exec(Ee)) && (H = W.shift(), K.push({
            value: H,
            // Cast descendant combinators to space
            type: W[0].replace(fe, " ")
          }), Ee = Ee.slice(H.length));
          for (pe in d.filter)
            (W = Wn[pe].exec(Ee)) && (!Le[pe] || (W = Le[pe](W))) && (H = W.shift(), K.push({
              value: H,
              type: pe,
              matches: W
            }), Ee = Ee.slice(H.length));
          if (!H)
            break;
        }
        return j ? Ee.length : Ee ? Dt.error(P) : (
          // Cache the tokens
          pt(P, Ae).slice(0)
        );
      }
      function li(P) {
        for (var j = 0, H = P.length, W = ""; j < H; j++)
          W += P[j].value;
        return W;
      }
      function ci(P, j, H) {
        var W = j.dir, K = j.next, pe = K || W, Ee = H && pe === "parentNode", Ae = ce++;
        return j.first ? (
          // Check against closest ancestor/preceding element
          function(Le, st, Ke) {
            for (; Le = Le[W]; )
              if (Le.nodeType === 1 || Ee)
                return P(Le, st, Ke);
            return !1;
          }
        ) : (
          // Check against all ancestor/preceding elements
          function(Le, st, Ke) {
            var Qe, lt, ze = [z, Ae];
            if (Ke) {
              for (; Le = Le[W]; )
                if ((Le.nodeType === 1 || Ee) && P(Le, st, Ke))
                  return !0;
            } else
              for (; Le = Le[W]; )
                if (Le.nodeType === 1 || Ee)
                  if (lt = Le[Q] || (Le[Q] = {}), K && O(Le, K))
                    Le = Le[W] || Le;
                  else {
                    if ((Qe = lt[pe]) && Qe[0] === z && Qe[1] === Ae)
                      return ze[2] = Qe[2];
                    if (lt[pe] = ze, ze[2] = P(Le, st, Ke))
                      return !0;
                  }
            return !1;
          }
        );
      }
      function Yo(P) {
        return P.length > 1 ? function(j, H, W) {
          for (var K = P.length; K--; )
            if (!P[K](j, H, W))
              return !1;
          return !0;
        } : P[0];
      }
      function cm(P, j, H) {
        for (var W = 0, K = j.length; W < K; W++)
          Dt(P, j[W], H);
        return H;
      }
      function ui(P, j, H, W, K) {
        for (var pe, Ee = [], Ae = 0, Le = P.length, st = j != null; Ae < Le; Ae++)
          (pe = P[Ae]) && (!H || H(pe, W, K)) && (Ee.push(pe), st && j.push(Ae));
        return Ee;
      }
      function Go(P, j, H, W, K, pe) {
        return W && !W[Q] && (W = Go(W)), K && !K[Q] && (K = Go(K, pe)), jn(function(Ee, Ae, Le, st) {
          var Ke, Qe, lt, ze, It = [], Cn = [], mn = Ae.length, On = Ee || cm(
            j || "*",
            Le.nodeType ? [Le] : Le,
            []
          ), Yn = P && (Ee || !j) ? ui(On, It, P, Le, st) : On;
          if (H ? (ze = K || (Ee ? P : mn || W) ? (
            // ...intermediate processing is necessary
            []
          ) : (
            // ...otherwise use results directly
            Ae
          ), H(Yn, ze, Le, st)) : ze = Yn, W)
            for (Ke = ui(ze, Cn), W(Ke, [], Le, st), Qe = Ke.length; Qe--; )
              (lt = Ke[Qe]) && (ze[Cn[Qe]] = !(Yn[Cn[Qe]] = lt));
          if (Ee) {
            if (K || P) {
              if (K) {
                for (Ke = [], Qe = ze.length; Qe--; )
                  (lt = ze[Qe]) && Ke.push(Yn[Qe] = lt);
                K(null, ze = [], Ke, st);
              }
              for (Qe = ze.length; Qe--; )
                (lt = ze[Qe]) && (Ke = K ? u.call(Ee, lt) : It[Qe]) > -1 && (Ee[Ke] = !(Ae[Ke] = lt));
            }
          } else
            ze = ui(
              ze === Ae ? ze.splice(mn, ze.length) : ze
            ), K ? K(null, Ae, ze, st) : w.apply(Ae, ze);
        });
      }
      function Ko(P) {
        for (var j, H, W, K = P.length, pe = d.relative[P[0].type], Ee = pe || d.relative[" "], Ae = pe ? 1 : 0, Le = ci(function(Qe) {
          return Qe === j;
        }, Ee, !0), st = ci(function(Qe) {
          return u.call(j, Qe) > -1;
        }, Ee, !0), Ke = [function(Qe, lt, ze) {
          var It = !pe && (ze || lt != m) || ((j = lt).nodeType ? Le(Qe, lt, ze) : st(Qe, lt, ze));
          return j = null, It;
        }]; Ae < K; Ae++)
          if (H = d.relative[P[Ae].type])
            Ke = [ci(Yo(Ke), H)];
          else {
            if (H = d.filter[P[Ae].type].apply(null, P[Ae].matches), H[Q]) {
              for (W = ++Ae; W < K && !d.relative[P[W].type]; W++)
                ;
              return Go(
                Ae > 1 && Yo(Ke),
                Ae > 1 && li(
                  // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                  P.slice(0, Ae - 1).concat({ value: P[Ae - 2].type === " " ? "*" : "" })
                ).replace(fe, "$1"),
                H,
                Ae < W && Ko(P.slice(Ae, W)),
                W < K && Ko(P = P.slice(W)),
                W < K && li(P)
              );
            }
            Ke.push(H);
          }
        return Yo(Ke);
      }
      function um(P, j) {
        var H = j.length > 0, W = P.length > 0, K = function(pe, Ee, Ae, Le, st) {
          var Ke, Qe, lt, ze = 0, It = "0", Cn = pe && [], mn = [], On = m, Yn = pe || W && d.find.TAG("*", st), Qr = z += On == null ? 1 : Math.random() || 0.1, xn = Yn.length;
          for (st && (m = Ee == S || Ee || st); It !== xn && (Ke = Yn[It]) != null; It++) {
            if (W && Ke) {
              for (Qe = 0, !Ee && Ke.ownerDocument != S && (vr(Ke), Ae = !I); lt = P[Qe++]; )
                if (lt(Ke, Ee || S, Ae)) {
                  w.call(Le, Ke);
                  break;
                }
              st && (z = Qr);
            }
            H && ((Ke = !lt && Ke) && ze--, pe && Cn.push(Ke));
          }
          if (ze += It, H && It !== ze) {
            for (Qe = 0; lt = j[Qe++]; )
              lt(Cn, mn, Ee, Ae);
            if (pe) {
              if (ze > 0)
                for (; It--; )
                  Cn[It] || mn[It] || (mn[It] = J.call(Le));
              mn = ui(mn);
            }
            w.apply(Le, mn), st && !pe && mn.length > 0 && ze + j.length > 1 && f.uniqueSort(Le);
          }
          return st && (z = Qr, m = On), Cn;
        };
        return H ? jn(K) : K;
      }
      function Jo(P, j) {
        var H, W = [], K = [], pe = it[P + " "];
        if (!pe) {
          for (j || (j = Na(P)), H = j.length; H--; )
            pe = Ko(j[H]), pe[Q] ? W.push(pe) : K.push(pe);
          pe = it(
            P,
            um(K, W)
          ), pe.selector = P;
        }
        return pe;
      }
      function bc(P, j, H, W) {
        var K, pe, Ee, Ae, Le, st = typeof P == "function" && P, Ke = !W && Na(P = st.selector || P);
        if (H = H || [], Ke.length === 1) {
          if (pe = Ke[0] = Ke[0].slice(0), pe.length > 2 && (Ee = pe[0]).type === "ID" && j.nodeType === 9 && I && d.relative[pe[1].type]) {
            if (j = (d.find.ID(
              Ee.matches[0].replace(ir, or),
              j
            ) || [])[0], j)
              st && (j = j.parentNode);
            else return H;
            P = P.slice(pe.shift().value.length);
          }
          for (K = Wn.needsContext.test(P) ? 0 : pe.length; K-- && (Ee = pe[K], !d.relative[Ae = Ee.type]); )
            if ((Le = d.find[Ae]) && (W = Le(
              Ee.matches[0].replace(ir, or),
              qo.test(pe[0].type) && Wo(j.parentNode) || j
            ))) {
              if (pe.splice(K, 1), P = W.length && li(pe), !P)
                return w.apply(H, W), H;
              break;
            }
        }
        return (st || Jo(P, Ke))(
          W,
          j,
          !I,
          H,
          !j || qo.test(P) && Wo(j.parentNode) || j
        ), H;
      }
      L.sortStable = Q.split("").sort(tn).join("") === Q, vr(), L.sortDetached = Jr(function(P) {
        return P.compareDocumentPosition(S.createElement("fieldset")) & 1;
      }), f.find = Dt, f.expr[":"] = f.expr.pseudos, f.unique = f.uniqueSort, Dt.compile = Jo, Dt.select = bc, Dt.setDocument = vr, Dt.tokenize = Na, Dt.escape = f.escapeSelector, Dt.getText = f.text, Dt.isXML = f.isXMLDoc, Dt.selectors = f.expr, Dt.support = f.support, Dt.uniqueSort = f.uniqueSort;
    })();
    var Te = function(o, d, m) {
      for (var h = [], b = m !== void 0; (o = o[d]) && o.nodeType !== 9; )
        if (o.nodeType === 1) {
          if (b && f(o).is(m))
            break;
          h.push(o);
        }
      return h;
    }, We = function(o, d) {
      for (var m = []; o; o = o.nextSibling)
        o.nodeType === 1 && o !== d && m.push(o);
      return m;
    }, Oe = f.expr.match.needsContext, Ne = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
    function Me(o, d, m) {
      return x(d) ? f.grep(o, function(h, b) {
        return !!d.call(h, b, h) !== m;
      }) : d.nodeType ? f.grep(o, function(h) {
        return h === d !== m;
      }) : typeof d != "string" ? f.grep(o, function(h) {
        return u.call(d, h) > -1 !== m;
      }) : f.filter(d, o, m);
    }
    f.filter = function(o, d, m) {
      var h = d[0];
      return m && (o = ":not(" + o + ")"), d.length === 1 && h.nodeType === 1 ? f.find.matchesSelector(h, o) ? [h] : [] : f.find.matches(o, f.grep(d, function(b) {
        return b.nodeType === 1;
      }));
    }, f.fn.extend({
      find: function(o) {
        var d, m, h = this.length, b = this;
        if (typeof o != "string")
          return this.pushStack(f(o).filter(function() {
            for (d = 0; d < h; d++)
              if (f.contains(b[d], this))
                return !0;
          }));
        for (m = this.pushStack([]), d = 0; d < h; d++)
          f.find(o, b[d], m);
        return h > 1 ? f.uniqueSort(m) : m;
      },
      filter: function(o) {
        return this.pushStack(Me(this, o || [], !1));
      },
      not: function(o) {
        return this.pushStack(Me(this, o || [], !0));
      },
      is: function(o) {
        return !!Me(
          this,
          // If this is a positional/relative selector, check membership in the returned set
          // so $("p:first").is("p:last") won't return true for a doc with two "p".
          typeof o == "string" && Oe.test(o) ? f(o) : o || [],
          !1
        ).length;
      }
    });
    var Ze, at = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/, He = f.fn.init = function(o, d, m) {
      var h, b;
      if (!o)
        return this;
      if (m = m || Ze, typeof o == "string")
        if (o[0] === "<" && o[o.length - 1] === ">" && o.length >= 3 ? h = [null, o, null] : h = at.exec(o), h && (h[1] || !d))
          if (h[1]) {
            if (d = d instanceof f ? d[0] : d, f.merge(this, f.parseHTML(
              h[1],
              d && d.nodeType ? d.ownerDocument || d : T,
              !0
            )), Ne.test(h[1]) && f.isPlainObject(d))
              for (h in d)
                x(this[h]) ? this[h](d[h]) : this.attr(h, d[h]);
            return this;
          } else
            return b = T.getElementById(h[2]), b && (this[0] = b, this.length = 1), this;
        else return !d || d.jquery ? (d || m).find(o) : this.constructor(d).find(o);
      else {
        if (o.nodeType)
          return this[0] = o, this.length = 1, this;
        if (x(o))
          return m.ready !== void 0 ? m.ready(o) : (
            // Execute immediately if ready is not present
            o(f)
          );
      }
      return f.makeArray(o, this);
    };
    He.prototype = f.fn, Ze = f(T);
    var nt = /^(?:parents|prev(?:Until|All))/, yt = {
      children: !0,
      contents: !0,
      next: !0,
      prev: !0
    };
    f.fn.extend({
      has: function(o) {
        var d = f(o, this), m = d.length;
        return this.filter(function() {
          for (var h = 0; h < m; h++)
            if (f.contains(this, d[h]))
              return !0;
        });
      },
      closest: function(o, d) {
        var m, h = 0, b = this.length, w = [], S = typeof o != "string" && f(o);
        if (!Oe.test(o)) {
          for (; h < b; h++)
            for (m = this[h]; m && m !== d; m = m.parentNode)
              if (m.nodeType < 11 && (S ? S.index(m) > -1 : (
                // Don't pass non-elements to jQuery#find
                m.nodeType === 1 && f.find.matchesSelector(m, o)
              ))) {
                w.push(m);
                break;
              }
        }
        return this.pushStack(w.length > 1 ? f.uniqueSort(w) : w);
      },
      // Determine the position of an element within the set
      index: function(o) {
        return o ? typeof o == "string" ? u.call(f(o), this[0]) : u.call(
          this,
          // If it receives a jQuery object, the first element is used
          o.jquery ? o[0] : o
        ) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
      },
      add: function(o, d) {
        return this.pushStack(
          f.uniqueSort(
            f.merge(this.get(), f(o, d))
          )
        );
      },
      addBack: function(o) {
        return this.add(
          o == null ? this.prevObject : this.prevObject.filter(o)
        );
      }
    });
    function Ct(o, d) {
      for (; (o = o[d]) && o.nodeType !== 1; )
        ;
      return o;
    }
    f.each({
      parent: function(o) {
        var d = o.parentNode;
        return d && d.nodeType !== 11 ? d : null;
      },
      parents: function(o) {
        return Te(o, "parentNode");
      },
      parentsUntil: function(o, d, m) {
        return Te(o, "parentNode", m);
      },
      next: function(o) {
        return Ct(o, "nextSibling");
      },
      prev: function(o) {
        return Ct(o, "previousSibling");
      },
      nextAll: function(o) {
        return Te(o, "nextSibling");
      },
      prevAll: function(o) {
        return Te(o, "previousSibling");
      },
      nextUntil: function(o, d, m) {
        return Te(o, "nextSibling", m);
      },
      prevUntil: function(o, d, m) {
        return Te(o, "previousSibling", m);
      },
      siblings: function(o) {
        return We((o.parentNode || {}).firstChild, o);
      },
      children: function(o) {
        return We(o.firstChild);
      },
      contents: function(o) {
        return o.contentDocument != null && // Support: IE 11+
        // <object> elements with no `data` attribute has an object
        // `contentDocument` with a `null` prototype.
        a(o.contentDocument) ? o.contentDocument : (O(o, "template") && (o = o.content || o), f.merge([], o.childNodes));
      }
    }, function(o, d) {
      f.fn[o] = function(m, h) {
        var b = f.map(this, d, m);
        return o.slice(-5) !== "Until" && (h = m), h && typeof h == "string" && (b = f.filter(h, b)), this.length > 1 && (yt[o] || f.uniqueSort(b), nt.test(o) && b.reverse()), this.pushStack(b);
      };
    });
    var rt = /[^\x20\t\r\n\f]+/g;
    function mt(o) {
      var d = {};
      return f.each(o.match(rt) || [], function(m, h) {
        d[h] = !0;
      }), d;
    }
    f.Callbacks = function(o) {
      o = typeof o == "string" ? mt(o) : f.extend({}, o);
      var d, m, h, b, w = [], S = [], M = -1, I = function() {
        for (b = b || o.once, h = d = !0; S.length; M = -1)
          for (m = S.shift(); ++M < w.length; )
            w[M].apply(m[0], m[1]) === !1 && o.stopOnFalse && (M = w.length, m = !1);
        o.memory || (m = !1), d = !1, b && (m ? w = [] : w = "");
      }, B = {
        // Add a callback or a collection of callbacks to the list
        add: function() {
          return w && (m && !d && (M = w.length - 1, S.push(m)), function Y(Q) {
            f.each(Q, function(z, ce) {
              x(ce) ? (!o.unique || !B.has(ce)) && w.push(ce) : ce && ce.length && N(ce) !== "string" && Y(ce);
            });
          }(arguments), m && !d && I()), this;
        },
        // Remove a callback from the list
        remove: function() {
          return f.each(arguments, function(Y, Q) {
            for (var z; (z = f.inArray(Q, w, z)) > -1; )
              w.splice(z, 1), z <= M && M--;
          }), this;
        },
        // Check if a given callback is in the list.
        // If no argument is given, return whether or not list has callbacks attached.
        has: function(Y) {
          return Y ? f.inArray(Y, w) > -1 : w.length > 0;
        },
        // Remove all callbacks from the list
        empty: function() {
          return w && (w = []), this;
        },
        // Disable .fire and .add
        // Abort any current/pending executions
        // Clear all callbacks and values
        disable: function() {
          return b = S = [], w = m = "", this;
        },
        disabled: function() {
          return !w;
        },
        // Disable .fire
        // Also disable .add unless we have memory (since it would have no effect)
        // Abort any pending executions
        lock: function() {
          return b = S = [], !m && !d && (w = m = ""), this;
        },
        locked: function() {
          return !!b;
        },
        // Call all callbacks with the given context and arguments
        fireWith: function(Y, Q) {
          return b || (Q = Q || [], Q = [Y, Q.slice ? Q.slice() : Q], S.push(Q), d || I()), this;
        },
        // Call all the callbacks with the given arguments
        fire: function() {
          return B.fireWith(this, arguments), this;
        },
        // To know if the callbacks have already been called at least once
        fired: function() {
          return !!h;
        }
      };
      return B;
    };
    function dt(o) {
      return o;
    }
    function Ie(o) {
      throw o;
    }
    function Ue(o, d, m, h) {
      var b;
      try {
        o && x(b = o.promise) ? b.call(o).done(d).fail(m) : o && x(b = o.then) ? b.call(o, d, m) : d.apply(void 0, [o].slice(h));
      } catch (w) {
        m.apply(void 0, [w]);
      }
    }
    f.extend({
      Deferred: function(o) {
        var d = [
          // action, add listener, callbacks,
          // ... .then handlers, argument index, [final state]
          [
            "notify",
            "progress",
            f.Callbacks("memory"),
            f.Callbacks("memory"),
            2
          ],
          [
            "resolve",
            "done",
            f.Callbacks("once memory"),
            f.Callbacks("once memory"),
            0,
            "resolved"
          ],
          [
            "reject",
            "fail",
            f.Callbacks("once memory"),
            f.Callbacks("once memory"),
            1,
            "rejected"
          ]
        ], m = "pending", h = {
          state: function() {
            return m;
          },
          always: function() {
            return b.done(arguments).fail(arguments), this;
          },
          catch: function(w) {
            return h.then(null, w);
          },
          // Keep pipe for back-compat
          pipe: function() {
            var w = arguments;
            return f.Deferred(function(S) {
              f.each(d, function(M, I) {
                var B = x(w[I[4]]) && w[I[4]];
                b[I[1]](function() {
                  var Y = B && B.apply(this, arguments);
                  Y && x(Y.promise) ? Y.promise().progress(S.notify).done(S.resolve).fail(S.reject) : S[I[0] + "With"](
                    this,
                    B ? [Y] : arguments
                  );
                });
              }), w = null;
            }).promise();
          },
          then: function(w, S, M) {
            var I = 0;
            function B(Y, Q, z, ce) {
              return function() {
                var Je = this, pt = arguments, it = function() {
                  var tn, Hn;
                  if (!(Y < I)) {
                    if (tn = z.apply(Je, pt), tn === Q.promise())
                      throw new TypeError("Thenable self-resolution");
                    Hn = tn && // Support: Promises/A+ section 2.3.4
                    // https://promisesaplus.com/#point-64
                    // Only check objects and functions for thenability
                    (typeof tn == "object" || typeof tn == "function") && tn.then, x(Hn) ? ce ? Hn.call(
                      tn,
                      B(I, Q, dt, ce),
                      B(I, Q, Ie, ce)
                    ) : (I++, Hn.call(
                      tn,
                      B(I, Q, dt, ce),
                      B(I, Q, Ie, ce),
                      B(
                        I,
                        Q,
                        dt,
                        Q.notifyWith
                      )
                    )) : (z !== dt && (Je = void 0, pt = [tn]), (ce || Q.resolveWith)(Je, pt));
                  }
                }, ln = ce ? it : function() {
                  try {
                    it();
                  } catch (tn) {
                    f.Deferred.exceptionHook && f.Deferred.exceptionHook(
                      tn,
                      ln.error
                    ), Y + 1 >= I && (z !== Ie && (Je = void 0, pt = [tn]), Q.rejectWith(Je, pt));
                  }
                };
                Y ? ln() : (f.Deferred.getErrorHook ? ln.error = f.Deferred.getErrorHook() : f.Deferred.getStackHook && (ln.error = f.Deferred.getStackHook()), t.setTimeout(ln));
              };
            }
            return f.Deferred(function(Y) {
              d[0][3].add(
                B(
                  0,
                  Y,
                  x(M) ? M : dt,
                  Y.notifyWith
                )
              ), d[1][3].add(
                B(
                  0,
                  Y,
                  x(w) ? w : dt
                )
              ), d[2][3].add(
                B(
                  0,
                  Y,
                  x(S) ? S : Ie
                )
              );
            }).promise();
          },
          // Get a promise for this deferred
          // If obj is provided, the promise aspect is added to the object
          promise: function(w) {
            return w != null ? f.extend(w, h) : h;
          }
        }, b = {};
        return f.each(d, function(w, S) {
          var M = S[2], I = S[5];
          h[S[1]] = M.add, I && M.add(
            function() {
              m = I;
            },
            // rejected_callbacks.disable
            // fulfilled_callbacks.disable
            d[3 - w][2].disable,
            // rejected_handlers.disable
            // fulfilled_handlers.disable
            d[3 - w][3].disable,
            // progress_callbacks.lock
            d[0][2].lock,
            // progress_handlers.lock
            d[0][3].lock
          ), M.add(S[3].fire), b[S[0]] = function() {
            return b[S[0] + "With"](this === b ? void 0 : this, arguments), this;
          }, b[S[0] + "With"] = M.fireWith;
        }), h.promise(b), o && o.call(b, b), b;
      },
      // Deferred helper
      when: function(o) {
        var d = arguments.length, m = d, h = Array(m), b = i.call(arguments), w = f.Deferred(), S = function(M) {
          return function(I) {
            h[M] = this, b[M] = arguments.length > 1 ? i.call(arguments) : I, --d || w.resolveWith(h, b);
          };
        };
        if (d <= 1 && (Ue(
          o,
          w.done(S(m)).resolve,
          w.reject,
          !d
        ), w.state() === "pending" || x(b[m] && b[m].then)))
          return w.then();
        for (; m--; )
          Ue(b[m], S(m), w.reject);
        return w.promise();
      }
    });
    var Xe = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
    f.Deferred.exceptionHook = function(o, d) {
      t.console && t.console.warn && o && Xe.test(o.name) && t.console.warn(
        "jQuery.Deferred exception: " + o.message,
        o.stack,
        d
      );
    }, f.readyException = function(o) {
      t.setTimeout(function() {
        throw o;
      });
    };
    var ae = f.Deferred();
    f.fn.ready = function(o) {
      return ae.then(o).catch(function(d) {
        f.readyException(d);
      }), this;
    }, f.extend({
      // Is the DOM ready to be used? Set to true once it occurs.
      isReady: !1,
      // A counter to track how many items to wait for before
      // the ready event fires. See trac-6781
      readyWait: 1,
      // Handle when the DOM is ready
      ready: function(o) {
        (o === !0 ? --f.readyWait : f.isReady) || (f.isReady = !0, !(o !== !0 && --f.readyWait > 0) && ae.resolveWith(T, [f]));
      }
    }), f.ready.then = ae.then;
    function oe() {
      T.removeEventListener("DOMContentLoaded", oe), t.removeEventListener("load", oe), f.ready();
    }
    T.readyState === "complete" || T.readyState !== "loading" && !T.documentElement.doScroll ? t.setTimeout(f.ready) : (T.addEventListener("DOMContentLoaded", oe), t.addEventListener("load", oe));
    var we = function(o, d, m, h, b, w, S) {
      var M = 0, I = o.length, B = m == null;
      if (N(m) === "object") {
        b = !0;
        for (M in m)
          we(o, d, M, m[M], !0, w, S);
      } else if (h !== void 0 && (b = !0, x(h) || (S = !0), B && (S ? (d.call(o, h), d = null) : (B = d, d = function(Y, Q, z) {
        return B.call(f(Y), z);
      })), d))
        for (; M < I; M++)
          d(
            o[M],
            m,
            S ? h : h.call(o[M], M, d(o[M], m))
          );
      return b ? o : B ? d.call(o) : I ? d(o[0], m) : w;
    }, De = /^-ms-/, ue = /-([a-z])/g;
    function ne(o, d) {
      return d.toUpperCase();
    }
    function he(o) {
      return o.replace(De, "ms-").replace(ue, ne);
    }
    var et = function(o) {
      return o.nodeType === 1 || o.nodeType === 9 || !+o.nodeType;
    };
    function se() {
      this.expando = f.expando + se.uid++;
    }
    se.uid = 1, se.prototype = {
      cache: function(o) {
        var d = o[this.expando];
        return d || (d = {}, et(o) && (o.nodeType ? o[this.expando] = d : Object.defineProperty(o, this.expando, {
          value: d,
          configurable: !0
        }))), d;
      },
      set: function(o, d, m) {
        var h, b = this.cache(o);
        if (typeof d == "string")
          b[he(d)] = m;
        else
          for (h in d)
            b[he(h)] = d[h];
        return b;
      },
      get: function(o, d) {
        return d === void 0 ? this.cache(o) : (
          // Always use camelCase key (gh-2257)
          o[this.expando] && o[this.expando][he(d)]
        );
      },
      access: function(o, d, m) {
        return d === void 0 || d && typeof d == "string" && m === void 0 ? this.get(o, d) : (this.set(o, d, m), m !== void 0 ? m : d);
      },
      remove: function(o, d) {
        var m, h = o[this.expando];
        if (h !== void 0) {
          if (d !== void 0)
            for (Array.isArray(d) ? d = d.map(he) : (d = he(d), d = d in h ? [d] : d.match(rt) || []), m = d.length; m--; )
              delete h[d[m]];
          (d === void 0 || f.isEmptyObject(h)) && (o.nodeType ? o[this.expando] = void 0 : delete o[this.expando]);
        }
      },
      hasData: function(o) {
        var d = o[this.expando];
        return d !== void 0 && !f.isEmptyObject(d);
      }
    };
    var G = new se(), Re = new se(), bt = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, St = /[A-Z]/g;
    function an(o) {
      return o === "true" ? !0 : o === "false" ? !1 : o === "null" ? null : o === +o + "" ? +o : bt.test(o) ? JSON.parse(o) : o;
    }
    function ct(o, d, m) {
      var h;
      if (m === void 0 && o.nodeType === 1)
        if (h = "data-" + d.replace(St, "-$&").toLowerCase(), m = o.getAttribute(h), typeof m == "string") {
          try {
            m = an(m);
          } catch {
          }
          Re.set(o, d, m);
        } else
          m = void 0;
      return m;
    }
    f.extend({
      hasData: function(o) {
        return Re.hasData(o) || G.hasData(o);
      },
      data: function(o, d, m) {
        return Re.access(o, d, m);
      },
      removeData: function(o, d) {
        Re.remove(o, d);
      },
      // TODO: Now that all calls to _data and _removeData have been replaced
      // with direct calls to dataPriv methods, these can be deprecated.
      _data: function(o, d, m) {
        return G.access(o, d, m);
      },
      _removeData: function(o, d) {
        G.remove(o, d);
      }
    }), f.fn.extend({
      data: function(o, d) {
        var m, h, b, w = this[0], S = w && w.attributes;
        if (o === void 0) {
          if (this.length && (b = Re.get(w), w.nodeType === 1 && !G.get(w, "hasDataAttrs"))) {
            for (m = S.length; m--; )
              S[m] && (h = S[m].name, h.indexOf("data-") === 0 && (h = he(h.slice(5)), ct(w, h, b[h])));
            G.set(w, "hasDataAttrs", !0);
          }
          return b;
        }
        return typeof o == "object" ? this.each(function() {
          Re.set(this, o);
        }) : we(this, function(M) {
          var I;
          if (w && M === void 0)
            return I = Re.get(w, o), I !== void 0 || (I = ct(w, o), I !== void 0) ? I : void 0;
          this.each(function() {
            Re.set(this, o, M);
          });
        }, null, d, arguments.length > 1, null, !0);
      },
      removeData: function(o) {
        return this.each(function() {
          Re.remove(this, o);
        });
      }
    }), f.extend({
      queue: function(o, d, m) {
        var h;
        if (o)
          return d = (d || "fx") + "queue", h = G.get(o, d), m && (!h || Array.isArray(m) ? h = G.access(o, d, f.makeArray(m)) : h.push(m)), h || [];
      },
      dequeue: function(o, d) {
        d = d || "fx";
        var m = f.queue(o, d), h = m.length, b = m.shift(), w = f._queueHooks(o, d), S = function() {
          f.dequeue(o, d);
        };
        b === "inprogress" && (b = m.shift(), h--), b && (d === "fx" && m.unshift("inprogress"), delete w.stop, b.call(o, S, w)), !h && w && w.empty.fire();
      },
      // Not public - generate a queueHooks object, or return the current one
      _queueHooks: function(o, d) {
        var m = d + "queueHooks";
        return G.get(o, m) || G.access(o, m, {
          empty: f.Callbacks("once memory").add(function() {
            G.remove(o, [d + "queue", m]);
          })
        });
      }
    }), f.fn.extend({
      queue: function(o, d) {
        var m = 2;
        return typeof o != "string" && (d = o, o = "fx", m--), arguments.length < m ? f.queue(this[0], o) : d === void 0 ? this : this.each(function() {
          var h = f.queue(this, o, d);
          f._queueHooks(this, o), o === "fx" && h[0] !== "inprogress" && f.dequeue(this, o);
        });
      },
      dequeue: function(o) {
        return this.each(function() {
          f.dequeue(this, o);
        });
      },
      clearQueue: function(o) {
        return this.queue(o || "fx", []);
      },
      // Get a promise resolved when queues of a certain type
      // are emptied (fx is the type by default)
      promise: function(o, d) {
        var m, h = 1, b = f.Deferred(), w = this, S = this.length, M = function() {
          --h || b.resolveWith(w, [w]);
        };
        for (typeof o != "string" && (d = o, o = void 0), o = o || "fx"; S--; )
          m = G.get(w[S], o + "queueHooks"), m && m.empty && (h++, m.empty.add(M));
        return M(), b.promise(d);
      }
    });
    var yn = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source, un = new RegExp("^(?:([+-])=|)(" + yn + ")([a-z%]*)$", "i"), Ot = ["Top", "Right", "Bottom", "Left"], Ht = T.documentElement, dn = function(o) {
      return f.contains(o.ownerDocument, o);
    }, Dn = { composed: !0 };
    Ht.getRootNode && (dn = function(o) {
      return f.contains(o.ownerDocument, o) || o.getRootNode(Dn) === o.ownerDocument;
    });
    var Qt = function(o, d) {
      return o = d || o, o.style.display === "none" || o.style.display === "" && // Otherwise, check computed style
      // Support: Firefox <=43 - 45
      // Disconnected elements can have computed display: none, so first confirm that elem is
      // in the document.
      dn(o) && f.css(o, "display") === "none";
    };
    function kn(o, d, m, h) {
      var b, w, S = 20, M = h ? function() {
        return h.cur();
      } : function() {
        return f.css(o, d, "");
      }, I = M(), B = m && m[3] || (f.cssNumber[d] ? "" : "px"), Y = o.nodeType && (f.cssNumber[d] || B !== "px" && +I) && un.exec(f.css(o, d));
      if (Y && Y[3] !== B) {
        for (I = I / 2, B = B || Y[3], Y = +I || 1; S--; )
          f.style(o, d, Y + B), (1 - w) * (1 - (w = M() / I || 0.5)) <= 0 && (S = 0), Y = Y / w;
        Y = Y * 2, f.style(o, d, Y + B), m = m || [];
      }
      return m && (Y = +Y || +I || 0, b = m[1] ? Y + (m[1] + 1) * m[2] : +m[2], h && (h.unit = B, h.start = Y, h.end = b)), b;
    }
    var Rn = {};
    function dr(o) {
      var d, m = o.ownerDocument, h = o.nodeName, b = Rn[h];
      return b || (d = m.body.appendChild(m.createElement(h)), b = f.css(d, "display"), d.parentNode.removeChild(d), b === "none" && (b = "block"), Rn[h] = b, b);
    }
    function En(o, d) {
      for (var m, h, b = [], w = 0, S = o.length; w < S; w++)
        h = o[w], h.style && (m = h.style.display, d ? (m === "none" && (b[w] = G.get(h, "display") || null, b[w] || (h.style.display = "")), h.style.display === "" && Qt(h) && (b[w] = dr(h))) : m !== "none" && (b[w] = "none", G.set(h, "display", m)));
      for (w = 0; w < S; w++)
        b[w] != null && (o[w].style.display = b[w]);
      return o;
    }
    f.fn.extend({
      show: function() {
        return En(this, !0);
      },
      hide: function() {
        return En(this);
      },
      toggle: function(o) {
        return typeof o == "boolean" ? o ? this.show() : this.hide() : this.each(function() {
          Qt(this) ? f(this).show() : f(this).hide();
        });
      }
    });
    var Xt = /^(?:checkbox|radio)$/i, zt = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i, fr = /^$|^module$|\/(?:java|ecma)script/i;
    (function() {
      var o = T.createDocumentFragment(), d = o.appendChild(T.createElement("div")), m = T.createElement("input");
      m.setAttribute("type", "radio"), m.setAttribute("checked", "checked"), m.setAttribute("name", "t"), d.appendChild(m), L.checkClone = d.cloneNode(!0).cloneNode(!0).lastChild.checked, d.innerHTML = "<textarea>x</textarea>", L.noCloneChecked = !!d.cloneNode(!0).lastChild.defaultValue, d.innerHTML = "<option></option>", L.option = !!d.lastChild;
    })();
    var te = {
      // XHTML parsers do not magically insert elements in the
      // same way that tag soup parsers do. So we cannot shorten
      // this by omitting <tbody> or other required elements.
      thead: [1, "<table>", "</table>"],
      col: [2, "<table><colgroup>", "</colgroup></table>"],
      tr: [2, "<table><tbody>", "</tbody></table>"],
      td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
      _default: [0, "", ""]
    };
    te.tbody = te.tfoot = te.colgroup = te.caption = te.thead, te.th = te.td, L.option || (te.optgroup = te.option = [1, "<select multiple='multiple'>", "</select>"]);
    function de(o, d) {
      var m;
      return typeof o.getElementsByTagName < "u" ? m = o.getElementsByTagName(d || "*") : typeof o.querySelectorAll < "u" ? m = o.querySelectorAll(d || "*") : m = [], d === void 0 || d && O(o, d) ? f.merge([o], m) : m;
    }
    function Fe(o, d) {
      for (var m = 0, h = o.length; m < h; m++)
        G.set(
          o[m],
          "globalEval",
          !d || G.get(d[m], "globalEval")
        );
    }
    var Be = /<|&#?\w+;/;
    function Tt(o, d, m, h, b) {
      for (var w, S, M, I, B, Y, Q = d.createDocumentFragment(), z = [], ce = 0, Je = o.length; ce < Je; ce++)
        if (w = o[ce], w || w === 0)
          if (N(w) === "object")
            f.merge(z, w.nodeType ? [w] : w);
          else if (!Be.test(w))
            z.push(d.createTextNode(w));
          else {
            for (S = S || Q.appendChild(d.createElement("div")), M = (zt.exec(w) || ["", ""])[1].toLowerCase(), I = te[M] || te._default, S.innerHTML = I[1] + f.htmlPrefilter(w) + I[2], Y = I[0]; Y--; )
              S = S.lastChild;
            f.merge(z, S.childNodes), S = Q.firstChild, S.textContent = "";
          }
      for (Q.textContent = "", ce = 0; w = z[ce++]; ) {
        if (h && f.inArray(w, h) > -1) {
          b && b.push(w);
          continue;
        }
        if (B = dn(w), S = de(Q.appendChild(w), "script"), B && Fe(S), m)
          for (Y = 0; w = S[Y++]; )
            fr.test(w.type || "") && m.push(w);
      }
      return Q;
    }
    var Ge = /^([^.]*)(?:\.(.+)|)/;
    function ot() {
      return !0;
    }
    function Nt() {
      return !1;
    }
    function bn(o, d, m, h, b, w) {
      var S, M;
      if (typeof d == "object") {
        typeof m != "string" && (h = h || m, m = void 0);
        for (M in d)
          bn(o, M, m, h, d[M], w);
        return o;
      }
      if (h == null && b == null ? (b = m, h = m = void 0) : b == null && (typeof m == "string" ? (b = h, h = void 0) : (b = h, h = m, m = void 0)), b === !1)
        b = Nt;
      else if (!b)
        return o;
      return w === 1 && (S = b, b = function(I) {
        return f().off(I), S.apply(this, arguments);
      }, b.guid = S.guid || (S.guid = f.guid++)), o.each(function() {
        f.event.add(this, d, b, h, m);
      });
    }
    f.event = {
      global: {},
      add: function(o, d, m, h, b) {
        var w, S, M, I, B, Y, Q, z, ce, Je, pt, it = G.get(o);
        if (et(o))
          for (m.handler && (w = m, m = w.handler, b = w.selector), b && f.find.matchesSelector(Ht, b), m.guid || (m.guid = f.guid++), (I = it.events) || (I = it.events = /* @__PURE__ */ Object.create(null)), (S = it.handle) || (S = it.handle = function(ln) {
            return typeof f < "u" && f.event.triggered !== ln.type ? f.event.dispatch.apply(o, arguments) : void 0;
          }), d = (d || "").match(rt) || [""], B = d.length; B--; )
            M = Ge.exec(d[B]) || [], ce = pt = M[1], Je = (M[2] || "").split(".").sort(), ce && (Q = f.event.special[ce] || {}, ce = (b ? Q.delegateType : Q.bindType) || ce, Q = f.event.special[ce] || {}, Y = f.extend({
              type: ce,
              origType: pt,
              data: h,
              handler: m,
              guid: m.guid,
              selector: b,
              needsContext: b && f.expr.match.needsContext.test(b),
              namespace: Je.join(".")
            }, w), (z = I[ce]) || (z = I[ce] = [], z.delegateCount = 0, (!Q.setup || Q.setup.call(o, h, Je, S) === !1) && o.addEventListener && o.addEventListener(ce, S)), Q.add && (Q.add.call(o, Y), Y.handler.guid || (Y.handler.guid = m.guid)), b ? z.splice(z.delegateCount++, 0, Y) : z.push(Y), f.event.global[ce] = !0);
      },
      // Detach an event or set of events from an element
      remove: function(o, d, m, h, b) {
        var w, S, M, I, B, Y, Q, z, ce, Je, pt, it = G.hasData(o) && G.get(o);
        if (!(!it || !(I = it.events))) {
          for (d = (d || "").match(rt) || [""], B = d.length; B--; ) {
            if (M = Ge.exec(d[B]) || [], ce = pt = M[1], Je = (M[2] || "").split(".").sort(), !ce) {
              for (ce in I)
                f.event.remove(o, ce + d[B], m, h, !0);
              continue;
            }
            for (Q = f.event.special[ce] || {}, ce = (h ? Q.delegateType : Q.bindType) || ce, z = I[ce] || [], M = M[2] && new RegExp("(^|\\.)" + Je.join("\\.(?:.*\\.|)") + "(\\.|$)"), S = w = z.length; w--; )
              Y = z[w], (b || pt === Y.origType) && (!m || m.guid === Y.guid) && (!M || M.test(Y.namespace)) && (!h || h === Y.selector || h === "**" && Y.selector) && (z.splice(w, 1), Y.selector && z.delegateCount--, Q.remove && Q.remove.call(o, Y));
            S && !z.length && ((!Q.teardown || Q.teardown.call(o, Je, it.handle) === !1) && f.removeEvent(o, ce, it.handle), delete I[ce]);
          }
          f.isEmptyObject(I) && G.remove(o, "handle events");
        }
      },
      dispatch: function(o) {
        var d, m, h, b, w, S, M = new Array(arguments.length), I = f.event.fix(o), B = (G.get(this, "events") || /* @__PURE__ */ Object.create(null))[I.type] || [], Y = f.event.special[I.type] || {};
        for (M[0] = I, d = 1; d < arguments.length; d++)
          M[d] = arguments[d];
        if (I.delegateTarget = this, !(Y.preDispatch && Y.preDispatch.call(this, I) === !1)) {
          for (S = f.event.handlers.call(this, I, B), d = 0; (b = S[d++]) && !I.isPropagationStopped(); )
            for (I.currentTarget = b.elem, m = 0; (w = b.handlers[m++]) && !I.isImmediatePropagationStopped(); )
              (!I.rnamespace || w.namespace === !1 || I.rnamespace.test(w.namespace)) && (I.handleObj = w, I.data = w.data, h = ((f.event.special[w.origType] || {}).handle || w.handler).apply(b.elem, M), h !== void 0 && (I.result = h) === !1 && (I.preventDefault(), I.stopPropagation()));
          return Y.postDispatch && Y.postDispatch.call(this, I), I.result;
        }
      },
      handlers: function(o, d) {
        var m, h, b, w, S, M = [], I = d.delegateCount, B = o.target;
        if (I && // Support: IE <=9
        // Black-hole SVG <use> instance trees (trac-13180)
        B.nodeType && // Support: Firefox <=42
        // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
        // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
        // Support: IE 11 only
        // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
        !(o.type === "click" && o.button >= 1)) {
          for (; B !== this; B = B.parentNode || this)
            if (B.nodeType === 1 && !(o.type === "click" && B.disabled === !0)) {
              for (w = [], S = {}, m = 0; m < I; m++)
                h = d[m], b = h.selector + " ", S[b] === void 0 && (S[b] = h.needsContext ? f(b, this).index(B) > -1 : f.find(b, this, null, [B]).length), S[b] && w.push(h);
              w.length && M.push({ elem: B, handlers: w });
            }
        }
        return B = this, I < d.length && M.push({ elem: B, handlers: d.slice(I) }), M;
      },
      addProp: function(o, d) {
        Object.defineProperty(f.Event.prototype, o, {
          enumerable: !0,
          configurable: !0,
          get: x(d) ? function() {
            if (this.originalEvent)
              return d(this.originalEvent);
          } : function() {
            if (this.originalEvent)
              return this.originalEvent[o];
          },
          set: function(m) {
            Object.defineProperty(this, o, {
              enumerable: !0,
              configurable: !0,
              writable: !0,
              value: m
            });
          }
        });
      },
      fix: function(o) {
        return o[f.expando] ? o : new f.Event(o);
      },
      special: {
        load: {
          // Prevent triggered image.load events from bubbling to window.load
          noBubble: !0
        },
        click: {
          // Utilize native event to ensure correct state for checkable inputs
          setup: function(o) {
            var d = this || o;
            return Xt.test(d.type) && d.click && O(d, "input") && fn(d, "click", !0), !1;
          },
          trigger: function(o) {
            var d = this || o;
            return Xt.test(d.type) && d.click && O(d, "input") && fn(d, "click"), !0;
          },
          // For cross-browser consistency, suppress native .click() on links
          // Also prevent it if we're currently inside a leveraged native-event stack
          _default: function(o) {
            var d = o.target;
            return Xt.test(d.type) && d.click && O(d, "input") && G.get(d, "click") || O(d, "a");
          }
        },
        beforeunload: {
          postDispatch: function(o) {
            o.result !== void 0 && o.originalEvent && (o.originalEvent.returnValue = o.result);
          }
        }
      }
    };
    function fn(o, d, m) {
      if (!m) {
        G.get(o, d) === void 0 && f.event.add(o, d, ot);
        return;
      }
      G.set(o, d, !1), f.event.add(o, d, {
        namespace: !1,
        handler: function(h) {
          var b, w = G.get(this, d);
          if (h.isTrigger & 1 && this[d]) {
            if (w)
              (f.event.special[d] || {}).delegateType && h.stopPropagation();
            else if (w = i.call(arguments), G.set(this, d, w), this[d](), b = G.get(this, d), G.set(this, d, !1), w !== b)
              return h.stopImmediatePropagation(), h.preventDefault(), b;
          } else w && (G.set(this, d, f.event.trigger(
            w[0],
            w.slice(1),
            this
          )), h.stopPropagation(), h.isImmediatePropagationStopped = ot);
        }
      });
    }
    f.removeEvent = function(o, d, m) {
      o.removeEventListener && o.removeEventListener(d, m);
    }, f.Event = function(o, d) {
      if (!(this instanceof f.Event))
        return new f.Event(o, d);
      o && o.type ? (this.originalEvent = o, this.type = o.type, this.isDefaultPrevented = o.defaultPrevented || o.defaultPrevented === void 0 && // Support: Android <=2.3 only
      o.returnValue === !1 ? ot : Nt, this.target = o.target && o.target.nodeType === 3 ? o.target.parentNode : o.target, this.currentTarget = o.currentTarget, this.relatedTarget = o.relatedTarget) : this.type = o, d && f.extend(this, d), this.timeStamp = o && o.timeStamp || Date.now(), this[f.expando] = !0;
    }, f.Event.prototype = {
      constructor: f.Event,
      isDefaultPrevented: Nt,
      isPropagationStopped: Nt,
      isImmediatePropagationStopped: Nt,
      isSimulated: !1,
      preventDefault: function() {
        var o = this.originalEvent;
        this.isDefaultPrevented = ot, o && !this.isSimulated && o.preventDefault();
      },
      stopPropagation: function() {
        var o = this.originalEvent;
        this.isPropagationStopped = ot, o && !this.isSimulated && o.stopPropagation();
      },
      stopImmediatePropagation: function() {
        var o = this.originalEvent;
        this.isImmediatePropagationStopped = ot, o && !this.isSimulated && o.stopImmediatePropagation(), this.stopPropagation();
      }
    }, f.each({
      altKey: !0,
      bubbles: !0,
      cancelable: !0,
      changedTouches: !0,
      ctrlKey: !0,
      detail: !0,
      eventPhase: !0,
      metaKey: !0,
      pageX: !0,
      pageY: !0,
      shiftKey: !0,
      view: !0,
      char: !0,
      code: !0,
      charCode: !0,
      key: !0,
      keyCode: !0,
      button: !0,
      buttons: !0,
      clientX: !0,
      clientY: !0,
      offsetX: !0,
      offsetY: !0,
      pointerId: !0,
      pointerType: !0,
      screenX: !0,
      screenY: !0,
      targetTouches: !0,
      toElement: !0,
      touches: !0,
      which: !0
    }, f.event.addProp), f.each({ focus: "focusin", blur: "focusout" }, function(o, d) {
      function m(h) {
        if (T.documentMode) {
          var b = G.get(this, "handle"), w = f.event.fix(h);
          w.type = h.type === "focusin" ? "focus" : "blur", w.isSimulated = !0, b(h), w.target === w.currentTarget && b(w);
        } else
          f.event.simulate(
            d,
            h.target,
            f.event.fix(h)
          );
      }
      f.event.special[o] = {
        // Utilize native event if possible so blur/focus sequence is correct
        setup: function() {
          var h;
          if (fn(this, o, !0), T.documentMode)
            h = G.get(this, d), h || this.addEventListener(d, m), G.set(this, d, (h || 0) + 1);
          else
            return !1;
        },
        trigger: function() {
          return fn(this, o), !0;
        },
        teardown: function() {
          var h;
          if (T.documentMode)
            h = G.get(this, d) - 1, h ? G.set(this, d, h) : (this.removeEventListener(d, m), G.remove(this, d));
          else
            return !1;
        },
        // Suppress native focus or blur if we're currently inside
        // a leveraged native-event stack
        _default: function(h) {
          return G.get(h.target, o);
        },
        delegateType: d
      }, f.event.special[d] = {
        setup: function() {
          var h = this.ownerDocument || this.document || this, b = T.documentMode ? this : h, w = G.get(b, d);
          w || (T.documentMode ? this.addEventListener(d, m) : h.addEventListener(o, m, !0)), G.set(b, d, (w || 0) + 1);
        },
        teardown: function() {
          var h = this.ownerDocument || this.document || this, b = T.documentMode ? this : h, w = G.get(b, d) - 1;
          w ? G.set(b, d, w) : (T.documentMode ? this.removeEventListener(d, m) : h.removeEventListener(o, m, !0), G.remove(b, d));
        }
      };
    }), f.each({
      mouseenter: "mouseover",
      mouseleave: "mouseout",
      pointerenter: "pointerover",
      pointerleave: "pointerout"
    }, function(o, d) {
      f.event.special[o] = {
        delegateType: d,
        bindType: d,
        handle: function(m) {
          var h, b = this, w = m.relatedTarget, S = m.handleObj;
          return (!w || w !== b && !f.contains(b, w)) && (m.type = S.origType, h = S.handler.apply(this, arguments), m.type = d), h;
        }
      };
    }), f.fn.extend({
      on: function(o, d, m, h) {
        return bn(this, o, d, m, h);
      },
      one: function(o, d, m, h) {
        return bn(this, o, d, m, h, 1);
      },
      off: function(o, d, m) {
        var h, b;
        if (o && o.preventDefault && o.handleObj)
          return h = o.handleObj, f(o.delegateTarget).off(
            h.namespace ? h.origType + "." + h.namespace : h.origType,
            h.selector,
            h.handler
          ), this;
        if (typeof o == "object") {
          for (b in o)
            this.off(b, d, o[b]);
          return this;
        }
        return (d === !1 || typeof d == "function") && (m = d, d = void 0), m === !1 && (m = Nt), this.each(function() {
          f.event.remove(this, o, m, d);
        });
      }
    });
    var Zt = /<script|<style|<link/i, qr = /checked\s*(?:[^=]|=\s*.checked.)/i, gt = /^\s*<!\[CDATA\[|\]\]>\s*$/g;
    function In(o, d) {
      return O(o, "table") && O(d.nodeType !== 11 ? d : d.firstChild, "tr") && f(o).children("tbody")[0] || o;
    }
    function ya(o) {
      return o.type = (o.getAttribute("type") !== null) + "/" + o.type, o;
    }
    function Io(o) {
      return (o.type || "").slice(0, 5) === "true/" ? o.type = o.type.slice(5) : o.removeAttribute("type"), o;
    }
    function Za(o, d) {
      var m, h, b, w, S, M, I;
      if (d.nodeType === 1) {
        if (G.hasData(o) && (w = G.get(o), I = w.events, I)) {
          G.remove(d, "handle events");
          for (b in I)
            for (m = 0, h = I[b].length; m < h; m++)
              f.event.add(d, b, I[b][m]);
        }
        Re.hasData(o) && (S = Re.access(o), M = f.extend({}, S), Re.set(d, M));
      }
    }
    function Ao(o, d) {
      var m = d.nodeName.toLowerCase();
      m === "input" && Xt.test(o.type) ? d.checked = o.checked : (m === "input" || m === "textarea") && (d.defaultValue = o.defaultValue);
    }
    function Fn(o, d, m, h) {
      d = s(d);
      var b, w, S, M, I, B, Y = 0, Q = o.length, z = Q - 1, ce = d[0], Je = x(ce);
      if (Je || Q > 1 && typeof ce == "string" && !L.checkClone && qr.test(ce))
        return o.each(function(pt) {
          var it = o.eq(pt);
          Je && (d[0] = ce.call(this, pt, it.html())), Fn(it, d, m, h);
        });
      if (Q && (b = Tt(d, o[0].ownerDocument, !1, o, h), w = b.firstChild, b.childNodes.length === 1 && (b = w), w || h)) {
        for (S = f.map(de(b, "script"), ya), M = S.length; Y < Q; Y++)
          I = b, Y !== z && (I = f.clone(I, !0, !0), M && f.merge(S, de(I, "script"))), m.call(o[Y], I, Y);
        if (M)
          for (B = S[S.length - 1].ownerDocument, f.map(S, Io), Y = 0; Y < M; Y++)
            I = S[Y], fr.test(I.type || "") && !G.access(I, "globalEval") && f.contains(B, I) && (I.src && (I.type || "").toLowerCase() !== "module" ? f._evalUrl && !I.noModule && f._evalUrl(I.src, {
              nonce: I.nonce || I.getAttribute("nonce")
            }, B) : k(I.textContent.replace(gt, ""), I, B));
      }
      return o;
    }
    function ei(o, d, m) {
      for (var h, b = d ? f.filter(d, o) : o, w = 0; (h = b[w]) != null; w++)
        !m && h.nodeType === 1 && f.cleanData(de(h)), h.parentNode && (m && dn(h) && Fe(de(h, "script")), h.parentNode.removeChild(h));
      return o;
    }
    f.extend({
      htmlPrefilter: function(o) {
        return o;
      },
      clone: function(o, d, m) {
        var h, b, w, S, M = o.cloneNode(!0), I = dn(o);
        if (!L.noCloneChecked && (o.nodeType === 1 || o.nodeType === 11) && !f.isXMLDoc(o))
          for (S = de(M), w = de(o), h = 0, b = w.length; h < b; h++)
            Ao(w[h], S[h]);
        if (d)
          if (m)
            for (w = w || de(o), S = S || de(M), h = 0, b = w.length; h < b; h++)
              Za(w[h], S[h]);
          else
            Za(o, M);
        return S = de(M, "script"), S.length > 0 && Fe(S, !I && de(o, "script")), M;
      },
      cleanData: function(o) {
        for (var d, m, h, b = f.event.special, w = 0; (m = o[w]) !== void 0; w++)
          if (et(m)) {
            if (d = m[G.expando]) {
              if (d.events)
                for (h in d.events)
                  b[h] ? f.event.remove(m, h) : f.removeEvent(m, h, d.handle);
              m[G.expando] = void 0;
            }
            m[Re.expando] && (m[Re.expando] = void 0);
          }
      }
    }), f.fn.extend({
      detach: function(o) {
        return ei(this, o, !0);
      },
      remove: function(o) {
        return ei(this, o);
      },
      text: function(o) {
        return we(this, function(d) {
          return d === void 0 ? f.text(this) : this.empty().each(function() {
            (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) && (this.textContent = d);
          });
        }, null, o, arguments.length);
      },
      append: function() {
        return Fn(this, arguments, function(o) {
          if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
            var d = In(this, o);
            d.appendChild(o);
          }
        });
      },
      prepend: function() {
        return Fn(this, arguments, function(o) {
          if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
            var d = In(this, o);
            d.insertBefore(o, d.firstChild);
          }
        });
      },
      before: function() {
        return Fn(this, arguments, function(o) {
          this.parentNode && this.parentNode.insertBefore(o, this);
        });
      },
      after: function() {
        return Fn(this, arguments, function(o) {
          this.parentNode && this.parentNode.insertBefore(o, this.nextSibling);
        });
      },
      empty: function() {
        for (var o, d = 0; (o = this[d]) != null; d++)
          o.nodeType === 1 && (f.cleanData(de(o, !1)), o.textContent = "");
        return this;
      },
      clone: function(o, d) {
        return o = o ?? !1, d = d ?? o, this.map(function() {
          return f.clone(this, o, d);
        });
      },
      html: function(o) {
        return we(this, function(d) {
          var m = this[0] || {}, h = 0, b = this.length;
          if (d === void 0 && m.nodeType === 1)
            return m.innerHTML;
          if (typeof d == "string" && !Zt.test(d) && !te[(zt.exec(d) || ["", ""])[1].toLowerCase()]) {
            d = f.htmlPrefilter(d);
            try {
              for (; h < b; h++)
                m = this[h] || {}, m.nodeType === 1 && (f.cleanData(de(m, !1)), m.innerHTML = d);
              m = 0;
            } catch {
            }
          }
          m && this.empty().append(d);
        }, null, o, arguments.length);
      },
      replaceWith: function() {
        var o = [];
        return Fn(this, arguments, function(d) {
          var m = this.parentNode;
          f.inArray(this, o) < 0 && (f.cleanData(de(this)), m && m.replaceChild(d, this));
        }, o);
      }
    }), f.each({
      appendTo: "append",
      prependTo: "prepend",
      insertBefore: "before",
      insertAfter: "after",
      replaceAll: "replaceWith"
    }, function(o, d) {
      f.fn[o] = function(m) {
        for (var h, b = [], w = f(m), S = w.length - 1, M = 0; M <= S; M++)
          h = M === S ? this : this.clone(!0), f(w[M])[d](h), c.apply(b, h.get());
        return this.pushStack(b);
      };
    });
    var ba = new RegExp("^(" + yn + ")(?!px)[a-z%]+$", "i"), wa = /^--/, Wr = function(o) {
      var d = o.ownerDocument.defaultView;
      return (!d || !d.opener) && (d = t), d.getComputedStyle(o);
    }, xa = function(o, d, m) {
      var h, b, w = {};
      for (b in d)
        w[b] = o.style[b], o.style[b] = d[b];
      h = m.call(o);
      for (b in d)
        o.style[b] = w[b];
      return h;
    }, ti = new RegExp(Ot.join("|"), "i");
    (function() {
      function o() {
        if (B) {
          I.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0", B.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%", Ht.appendChild(I).appendChild(B);
          var Y = t.getComputedStyle(B);
          m = Y.top !== "1%", M = d(Y.marginLeft) === 12, B.style.right = "60%", w = d(Y.right) === 36, h = d(Y.width) === 36, B.style.position = "absolute", b = d(B.offsetWidth / 3) === 12, Ht.removeChild(I), B = null;
        }
      }
      function d(Y) {
        return Math.round(parseFloat(Y));
      }
      var m, h, b, w, S, M, I = T.createElement("div"), B = T.createElement("div");
      B.style && (B.style.backgroundClip = "content-box", B.cloneNode(!0).style.backgroundClip = "", L.clearCloneStyle = B.style.backgroundClip === "content-box", f.extend(L, {
        boxSizingReliable: function() {
          return o(), h;
        },
        pixelBoxStyles: function() {
          return o(), w;
        },
        pixelPosition: function() {
          return o(), m;
        },
        reliableMarginLeft: function() {
          return o(), M;
        },
        scrollboxSize: function() {
          return o(), b;
        },
        // Support: IE 9 - 11+, Edge 15 - 18+
        // IE/Edge misreport `getComputedStyle` of table rows with width/height
        // set in CSS while `offset*` properties report correct values.
        // Behavior in IE 9 is more subtle than in newer versions & it passes
        // some versions of this test; make sure not to make it pass there!
        //
        // Support: Firefox 70+
        // Only Firefox includes border widths
        // in computed dimensions. (gh-4529)
        reliableTrDimensions: function() {
          var Y, Q, z, ce;
          return S == null && (Y = T.createElement("table"), Q = T.createElement("tr"), z = T.createElement("div"), Y.style.cssText = "position:absolute;left:-11111px;border-collapse:separate", Q.style.cssText = "box-sizing:content-box;border:1px solid", Q.style.height = "1px", z.style.height = "9px", z.style.display = "block", Ht.appendChild(Y).appendChild(Q).appendChild(z), ce = t.getComputedStyle(Q), S = parseInt(ce.height, 10) + parseInt(ce.borderTopWidth, 10) + parseInt(ce.borderBottomWidth, 10) === Q.offsetHeight, Ht.removeChild(Y)), S;
        }
      }));
    })();
    function kr(o, d, m) {
      var h, b, w, S, M = wa.test(d), I = o.style;
      return m = m || Wr(o), m && (S = m.getPropertyValue(d) || m[d], M && S && (S = S.replace(fe, "$1") || void 0), S === "" && !dn(o) && (S = f.style(o, d)), !L.pixelBoxStyles() && ba.test(S) && ti.test(d) && (h = I.width, b = I.minWidth, w = I.maxWidth, I.minWidth = I.maxWidth = I.width = S, S = m.width, I.width = h, I.minWidth = b, I.maxWidth = w)), S !== void 0 ? (
        // Support: IE <=9 - 11 only
        // IE returns zIndex value as an integer.
        S + ""
      ) : S;
    }
    function Yr(o, d) {
      return {
        get: function() {
          if (o()) {
            delete this.get;
            return;
          }
          return (this.get = d).apply(this, arguments);
        }
      };
    }
    var Gr = ["Webkit", "Moz", "ms"], Ea = T.createElement("div").style, ni = {};
    function Oo(o) {
      for (var d = o[0].toUpperCase() + o.slice(1), m = Gr.length; m--; )
        if (o = Gr[m] + d, o in Ea)
          return o;
    }
    function La(o) {
      var d = f.cssProps[o] || ni[o];
      return d || (o in Ea ? o : ni[o] = Oo(o) || o);
    }
    var Mo = /^(none|table(?!-c[ea]).+)/, $o = { position: "absolute", visibility: "hidden", display: "block" }, ri = {
      letterSpacing: "0",
      fontWeight: "400"
    };
    function Ca(o, d, m) {
      var h = un.exec(d);
      return h ? (
        // Guard against undefined "subtract", e.g., when used as in cssHooks
        Math.max(0, h[2] - (m || 0)) + (h[3] || "px")
      ) : d;
    }
    function Kr(o, d, m, h, b, w) {
      var S = d === "width" ? 1 : 0, M = 0, I = 0, B = 0;
      if (m === (h ? "border" : "content"))
        return 0;
      for (; S < 4; S += 2)
        m === "margin" && (B += f.css(o, m + Ot[S], !0, b)), h ? (m === "content" && (I -= f.css(o, "padding" + Ot[S], !0, b)), m !== "margin" && (I -= f.css(o, "border" + Ot[S] + "Width", !0, b))) : (I += f.css(o, "padding" + Ot[S], !0, b), m !== "padding" ? I += f.css(o, "border" + Ot[S] + "Width", !0, b) : M += f.css(o, "border" + Ot[S] + "Width", !0, b));
      return !h && w >= 0 && (I += Math.max(0, Math.ceil(
        o["offset" + d[0].toUpperCase() + d.slice(1)] - w - I - M - 0.5
        // If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
        // Use an explicit zero to avoid NaN (gh-3964)
      )) || 0), I + B;
    }
    function ai(o, d, m) {
      var h = Wr(o), b = !L.boxSizingReliable() || m, w = b && f.css(o, "boxSizing", !1, h) === "border-box", S = w, M = kr(o, d, h), I = "offset" + d[0].toUpperCase() + d.slice(1);
      if (ba.test(M)) {
        if (!m)
          return M;
        M = "auto";
      }
      return (!L.boxSizingReliable() && w || // Support: IE 10 - 11+, Edge 15 - 18+
      // IE/Edge misreport `getComputedStyle` of table rows with width/height
      // set in CSS while `offset*` properties report correct values.
      // Interestingly, in some cases IE 9 doesn't suffer from this issue.
      !L.reliableTrDimensions() && O(o, "tr") || // Fall back to offsetWidth/offsetHeight when value is "auto"
      // This happens for inline elements with no explicit setting (gh-3571)
      M === "auto" || // Support: Android <=4.1 - 4.3 only
      // Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
      !parseFloat(M) && f.css(o, "display", !1, h) === "inline") && // Make sure the element is visible & connected
      o.getClientRects().length && (w = f.css(o, "boxSizing", !1, h) === "border-box", S = I in o, S && (M = o[I])), M = parseFloat(M) || 0, M + Kr(
        o,
        d,
        m || (w ? "border" : "content"),
        S,
        h,
        // Provide the current computed size to request scroll gutter calculation (gh-3589)
        M
      ) + "px";
    }
    f.extend({
      // Add in style property hooks for overriding the default
      // behavior of getting and setting a style property
      cssHooks: {
        opacity: {
          get: function(o, d) {
            if (d) {
              var m = kr(o, "opacity");
              return m === "" ? "1" : m;
            }
          }
        }
      },
      // Don't automatically add "px" to these possibly-unitless properties
      cssNumber: {
        animationIterationCount: !0,
        aspectRatio: !0,
        borderImageSlice: !0,
        columnCount: !0,
        flexGrow: !0,
        flexShrink: !0,
        fontWeight: !0,
        gridArea: !0,
        gridColumn: !0,
        gridColumnEnd: !0,
        gridColumnStart: !0,
        gridRow: !0,
        gridRowEnd: !0,
        gridRowStart: !0,
        lineHeight: !0,
        opacity: !0,
        order: !0,
        orphans: !0,
        scale: !0,
        widows: !0,
        zIndex: !0,
        zoom: !0,
        // SVG-related
        fillOpacity: !0,
        floodOpacity: !0,
        stopOpacity: !0,
        strokeMiterlimit: !0,
        strokeOpacity: !0
      },
      // Add in properties whose names you wish to fix before
      // setting or getting the value
      cssProps: {},
      // Get and set the style property on a DOM Node
      style: function(o, d, m, h) {
        if (!(!o || o.nodeType === 3 || o.nodeType === 8 || !o.style)) {
          var b, w, S, M = he(d), I = wa.test(d), B = o.style;
          if (I || (d = La(M)), S = f.cssHooks[d] || f.cssHooks[M], m !== void 0) {
            if (w = typeof m, w === "string" && (b = un.exec(m)) && b[1] && (m = kn(o, d, b), w = "number"), m == null || m !== m)
              return;
            w === "number" && !I && (m += b && b[3] || (f.cssNumber[M] ? "" : "px")), !L.clearCloneStyle && m === "" && d.indexOf("background") === 0 && (B[d] = "inherit"), (!S || !("set" in S) || (m = S.set(o, m, h)) !== void 0) && (I ? B.setProperty(d, m) : B[d] = m);
          } else
            return S && "get" in S && (b = S.get(o, !1, h)) !== void 0 ? b : B[d];
        }
      },
      css: function(o, d, m, h) {
        var b, w, S, M = he(d), I = wa.test(d);
        return I || (d = La(M)), S = f.cssHooks[d] || f.cssHooks[M], S && "get" in S && (b = S.get(o, !0, m)), b === void 0 && (b = kr(o, d, h)), b === "normal" && d in ri && (b = ri[d]), m === "" || m ? (w = parseFloat(b), m === !0 || isFinite(w) ? w || 0 : b) : b;
      }
    }), f.each(["height", "width"], function(o, d) {
      f.cssHooks[d] = {
        get: function(m, h, b) {
          if (h)
            return Mo.test(f.css(m, "display")) && // Support: Safari 8+
            // Table columns in Safari have non-zero offsetWidth & zero
            // getBoundingClientRect().width unless display is changed.
            // Support: IE <=11 only
            // Running getBoundingClientRect on a disconnected node
            // in IE throws an error.
            (!m.getClientRects().length || !m.getBoundingClientRect().width) ? xa(m, $o, function() {
              return ai(m, d, b);
            }) : ai(m, d, b);
        },
        set: function(m, h, b) {
          var w, S = Wr(m), M = !L.scrollboxSize() && S.position === "absolute", I = M || b, B = I && f.css(m, "boxSizing", !1, S) === "border-box", Y = b ? Kr(
            m,
            d,
            b,
            B,
            S
          ) : 0;
          return B && M && (Y -= Math.ceil(
            m["offset" + d[0].toUpperCase() + d.slice(1)] - parseFloat(S[d]) - Kr(m, d, "border", !1, S) - 0.5
          )), Y && (w = un.exec(h)) && (w[3] || "px") !== "px" && (m.style[d] = h, h = f.css(m, d)), Ca(m, h, Y);
        }
      };
    }), f.cssHooks.marginLeft = Yr(
      L.reliableMarginLeft,
      function(o, d) {
        if (d)
          return (parseFloat(kr(o, "marginLeft")) || o.getBoundingClientRect().left - xa(o, { marginLeft: 0 }, function() {
            return o.getBoundingClientRect().left;
          })) + "px";
      }
    ), f.each({
      margin: "",
      padding: "",
      border: "Width"
    }, function(o, d) {
      f.cssHooks[o + d] = {
        expand: function(m) {
          for (var h = 0, b = {}, w = typeof m == "string" ? m.split(" ") : [m]; h < 4; h++)
            b[o + Ot[h] + d] = w[h] || w[h - 2] || w[0];
          return b;
        }
      }, o !== "margin" && (f.cssHooks[o + d].set = Ca);
    }), f.fn.extend({
      css: function(o, d) {
        return we(this, function(m, h, b) {
          var w, S, M = {}, I = 0;
          if (Array.isArray(h)) {
            for (w = Wr(m), S = h.length; I < S; I++)
              M[h[I]] = f.css(m, h[I], !1, w);
            return M;
          }
          return b !== void 0 ? f.style(m, h, b) : f.css(m, h);
        }, o, d, arguments.length > 1);
      }
    });
    function pn(o, d, m, h, b) {
      return new pn.prototype.init(o, d, m, h, b);
    }
    f.Tween = pn, pn.prototype = {
      constructor: pn,
      init: function(o, d, m, h, b, w) {
        this.elem = o, this.prop = m, this.easing = b || f.easing._default, this.options = d, this.start = this.now = this.cur(), this.end = h, this.unit = w || (f.cssNumber[m] ? "" : "px");
      },
      cur: function() {
        var o = pn.propHooks[this.prop];
        return o && o.get ? o.get(this) : pn.propHooks._default.get(this);
      },
      run: function(o) {
        var d, m = pn.propHooks[this.prop];
        return this.options.duration ? this.pos = d = f.easing[this.easing](
          o,
          this.options.duration * o,
          0,
          1,
          this.options.duration
        ) : this.pos = d = o, this.now = (this.end - this.start) * d + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), m && m.set ? m.set(this) : pn.propHooks._default.set(this), this;
      }
    }, pn.prototype.init.prototype = pn.prototype, pn.propHooks = {
      _default: {
        get: function(o) {
          var d;
          return o.elem.nodeType !== 1 || o.elem[o.prop] != null && o.elem.style[o.prop] == null ? o.elem[o.prop] : (d = f.css(o.elem, o.prop, ""), !d || d === "auto" ? 0 : d);
        },
        set: function(o) {
          f.fx.step[o.prop] ? f.fx.step[o.prop](o) : o.elem.nodeType === 1 && (f.cssHooks[o.prop] || o.elem.style[La(o.prop)] != null) ? f.style(o.elem, o.prop, o.now + o.unit) : o.elem[o.prop] = o.now;
        }
      }
    }, pn.propHooks.scrollTop = pn.propHooks.scrollLeft = {
      set: function(o) {
        o.elem.nodeType && o.elem.parentNode && (o.elem[o.prop] = o.now);
      }
    }, f.easing = {
      linear: function(o) {
        return o;
      },
      swing: function(o) {
        return 0.5 - Math.cos(o * Math.PI) / 2;
      },
      _default: "swing"
    }, f.fx = pn.prototype.init, f.fx.step = {};
    var pr, mr, ii = /^(?:toggle|show|hide)$/, Fo = /queueHooks$/;
    function Sa() {
      mr && (T.hidden === !1 && t.requestAnimationFrame ? t.requestAnimationFrame(Sa) : t.setTimeout(Sa, f.fx.interval), f.fx.tick());
    }
    function oi() {
      return t.setTimeout(function() {
        pr = void 0;
      }), pr = Date.now();
    }
    function _n(o, d) {
      var m, h = 0, b = { height: o };
      for (d = d ? 1 : 0; h < 4; h += 2 - d)
        m = Ot[h], b["margin" + m] = b["padding" + m] = o;
      return d && (b.opacity = b.width = o), b;
    }
    function rr(o, d, m) {
      for (var h, b = (U.tweeners[d] || []).concat(U.tweeners["*"]), w = 0, S = b.length; w < S; w++)
        if (h = b[w].call(m, d, o))
          return h;
    }
    function _o(o, d, m) {
      var h, b, w, S, M, I, B, Y, Q = "width" in d || "height" in d, z = this, ce = {}, Je = o.style, pt = o.nodeType && Qt(o), it = G.get(o, "fxshow");
      m.queue || (S = f._queueHooks(o, "fx"), S.unqueued == null && (S.unqueued = 0, M = S.empty.fire, S.empty.fire = function() {
        S.unqueued || M();
      }), S.unqueued++, z.always(function() {
        z.always(function() {
          S.unqueued--, f.queue(o, "fx").length || S.empty.fire();
        });
      }));
      for (h in d)
        if (b = d[h], ii.test(b)) {
          if (delete d[h], w = w || b === "toggle", b === (pt ? "hide" : "show"))
            if (b === "show" && it && it[h] !== void 0)
              pt = !0;
            else
              continue;
          ce[h] = it && it[h] || f.style(o, h);
        }
      if (I = !f.isEmptyObject(d), !(!I && f.isEmptyObject(ce))) {
        Q && o.nodeType === 1 && (m.overflow = [Je.overflow, Je.overflowX, Je.overflowY], B = it && it.display, B == null && (B = G.get(o, "display")), Y = f.css(o, "display"), Y === "none" && (B ? Y = B : (En([o], !0), B = o.style.display || B, Y = f.css(o, "display"), En([o]))), (Y === "inline" || Y === "inline-block" && B != null) && f.css(o, "float") === "none" && (I || (z.done(function() {
          Je.display = B;
        }), B == null && (Y = Je.display, B = Y === "none" ? "" : Y)), Je.display = "inline-block")), m.overflow && (Je.overflow = "hidden", z.always(function() {
          Je.overflow = m.overflow[0], Je.overflowX = m.overflow[1], Je.overflowY = m.overflow[2];
        })), I = !1;
        for (h in ce)
          I || (it ? "hidden" in it && (pt = it.hidden) : it = G.access(o, "fxshow", { display: B }), w && (it.hidden = !pt), pt && En([o], !0), z.done(function() {
            pt || En([o]), G.remove(o, "fxshow");
            for (h in ce)
              f.style(o, h, ce[h]);
          })), I = rr(pt ? it[h] : 0, h, z), h in it || (it[h] = I.start, pt && (I.end = I.start, I.start = 0));
      }
    }
    function q(o, d) {
      var m, h, b, w, S;
      for (m in o)
        if (h = he(m), b = d[h], w = o[m], Array.isArray(w) && (b = w[1], w = o[m] = w[0]), m !== h && (o[h] = w, delete o[m]), S = f.cssHooks[h], S && "expand" in S) {
          w = S.expand(w), delete o[h];
          for (m in w)
            m in o || (o[m] = w[m], d[m] = b);
        } else
          d[h] = b;
    }
    function U(o, d, m) {
      var h, b, w = 0, S = U.prefilters.length, M = f.Deferred().always(function() {
        delete I.elem;
      }), I = function() {
        if (b)
          return !1;
        for (var Q = pr || oi(), z = Math.max(0, B.startTime + B.duration - Q), ce = z / B.duration || 0, Je = 1 - ce, pt = 0, it = B.tweens.length; pt < it; pt++)
          B.tweens[pt].run(Je);
        return M.notifyWith(o, [B, Je, z]), Je < 1 && it ? z : (it || M.notifyWith(o, [B, 1, 0]), M.resolveWith(o, [B]), !1);
      }, B = M.promise({
        elem: o,
        props: f.extend({}, d),
        opts: f.extend(!0, {
          specialEasing: {},
          easing: f.easing._default
        }, m),
        originalProperties: d,
        originalOptions: m,
        startTime: pr || oi(),
        duration: m.duration,
        tweens: [],
        createTween: function(Q, z) {
          var ce = f.Tween(
            o,
            B.opts,
            Q,
            z,
            B.opts.specialEasing[Q] || B.opts.easing
          );
          return B.tweens.push(ce), ce;
        },
        stop: function(Q) {
          var z = 0, ce = Q ? B.tweens.length : 0;
          if (b)
            return this;
          for (b = !0; z < ce; z++)
            B.tweens[z].run(1);
          return Q ? (M.notifyWith(o, [B, 1, 0]), M.resolveWith(o, [B, Q])) : M.rejectWith(o, [B, Q]), this;
        }
      }), Y = B.props;
      for (q(Y, B.opts.specialEasing); w < S; w++)
        if (h = U.prefilters[w].call(B, o, Y, B.opts), h)
          return x(h.stop) && (f._queueHooks(B.elem, B.opts.queue).stop = h.stop.bind(h)), h;
      return f.map(Y, rr, B), x(B.opts.start) && B.opts.start.call(o, B), B.progress(B.opts.progress).done(B.opts.done, B.opts.complete).fail(B.opts.fail).always(B.opts.always), f.fx.timer(
        f.extend(I, {
          elem: o,
          anim: B,
          queue: B.opts.queue
        })
      ), B;
    }
    f.Animation = f.extend(U, {
      tweeners: {
        "*": [function(o, d) {
          var m = this.createTween(o, d);
          return kn(m.elem, o, un.exec(d), m), m;
        }]
      },
      tweener: function(o, d) {
        x(o) ? (d = o, o = ["*"]) : o = o.match(rt);
        for (var m, h = 0, b = o.length; h < b; h++)
          m = o[h], U.tweeners[m] = U.tweeners[m] || [], U.tweeners[m].unshift(d);
      },
      prefilters: [_o],
      prefilter: function(o, d) {
        d ? U.prefilters.unshift(o) : U.prefilters.push(o);
      }
    }), f.speed = function(o, d, m) {
      var h = o && typeof o == "object" ? f.extend({}, o) : {
        complete: m || !m && d || x(o) && o,
        duration: o,
        easing: m && d || d && !x(d) && d
      };
      return f.fx.off ? h.duration = 0 : typeof h.duration != "number" && (h.duration in f.fx.speeds ? h.duration = f.fx.speeds[h.duration] : h.duration = f.fx.speeds._default), (h.queue == null || h.queue === !0) && (h.queue = "fx"), h.old = h.complete, h.complete = function() {
        x(h.old) && h.old.call(this), h.queue && f.dequeue(this, h.queue);
      }, h;
    }, f.fn.extend({
      fadeTo: function(o, d, m, h) {
        return this.filter(Qt).css("opacity", 0).show().end().animate({ opacity: d }, o, m, h);
      },
      animate: function(o, d, m, h) {
        var b = f.isEmptyObject(o), w = f.speed(d, m, h), S = function() {
          var M = U(this, f.extend({}, o), w);
          (b || G.get(this, "finish")) && M.stop(!0);
        };
        return S.finish = S, b || w.queue === !1 ? this.each(S) : this.queue(w.queue, S);
      },
      stop: function(o, d, m) {
        var h = function(b) {
          var w = b.stop;
          delete b.stop, w(m);
        };
        return typeof o != "string" && (m = d, d = o, o = void 0), d && this.queue(o || "fx", []), this.each(function() {
          var b = !0, w = o != null && o + "queueHooks", S = f.timers, M = G.get(this);
          if (w)
            M[w] && M[w].stop && h(M[w]);
          else
            for (w in M)
              M[w] && M[w].stop && Fo.test(w) && h(M[w]);
          for (w = S.length; w--; )
            S[w].elem === this && (o == null || S[w].queue === o) && (S[w].anim.stop(m), b = !1, S.splice(w, 1));
          (b || !m) && f.dequeue(this, o);
        });
      },
      finish: function(o) {
        return o !== !1 && (o = o || "fx"), this.each(function() {
          var d, m = G.get(this), h = m[o + "queue"], b = m[o + "queueHooks"], w = f.timers, S = h ? h.length : 0;
          for (m.finish = !0, f.queue(this, o, []), b && b.stop && b.stop.call(this, !0), d = w.length; d--; )
            w[d].elem === this && w[d].queue === o && (w[d].anim.stop(!0), w.splice(d, 1));
          for (d = 0; d < S; d++)
            h[d] && h[d].finish && h[d].finish.call(this);
          delete m.finish;
        });
      }
    }), f.each(["toggle", "show", "hide"], function(o, d) {
      var m = f.fn[d];
      f.fn[d] = function(h, b, w) {
        return h == null || typeof h == "boolean" ? m.apply(this, arguments) : this.animate(_n(d, !0), h, b, w);
      };
    }), f.each({
      slideDown: _n("show"),
      slideUp: _n("hide"),
      slideToggle: _n("toggle"),
      fadeIn: { opacity: "show" },
      fadeOut: { opacity: "hide" },
      fadeToggle: { opacity: "toggle" }
    }, function(o, d) {
      f.fn[o] = function(m, h, b) {
        return this.animate(d, m, h, b);
      };
    }), f.timers = [], f.fx.tick = function() {
      var o, d = 0, m = f.timers;
      for (pr = Date.now(); d < m.length; d++)
        o = m[d], !o() && m[d] === o && m.splice(d--, 1);
      m.length || f.fx.stop(), pr = void 0;
    }, f.fx.timer = function(o) {
      f.timers.push(o), f.fx.start();
    }, f.fx.interval = 13, f.fx.start = function() {
      mr || (mr = !0, Sa());
    }, f.fx.stop = function() {
      mr = null;
    }, f.fx.speeds = {
      slow: 600,
      fast: 200,
      // Default speed
      _default: 400
    }, f.fn.delay = function(o, d) {
      return o = f.fx && f.fx.speeds[o] || o, d = d || "fx", this.queue(d, function(m, h) {
        var b = t.setTimeout(m, o);
        h.stop = function() {
          t.clearTimeout(b);
        };
      });
    }, function() {
      var o = T.createElement("input"), d = T.createElement("select"), m = d.appendChild(T.createElement("option"));
      o.type = "checkbox", L.checkOn = o.value !== "", L.optSelected = m.selected, o = T.createElement("input"), o.value = "t", o.type = "radio", L.radioValue = o.value === "t";
    }();
    var me, ve = f.expr.attrHandle;
    f.fn.extend({
      attr: function(o, d) {
        return we(this, f.attr, o, d, arguments.length > 1);
      },
      removeAttr: function(o) {
        return this.each(function() {
          f.removeAttr(this, o);
        });
      }
    }), f.extend({
      attr: function(o, d, m) {
        var h, b, w = o.nodeType;
        if (!(w === 3 || w === 8 || w === 2)) {
          if (typeof o.getAttribute > "u")
            return f.prop(o, d, m);
          if ((w !== 1 || !f.isXMLDoc(o)) && (b = f.attrHooks[d.toLowerCase()] || (f.expr.match.bool.test(d) ? me : void 0)), m !== void 0) {
            if (m === null) {
              f.removeAttr(o, d);
              return;
            }
            return b && "set" in b && (h = b.set(o, m, d)) !== void 0 ? h : (o.setAttribute(d, m + ""), m);
          }
          return b && "get" in b && (h = b.get(o, d)) !== null ? h : (h = f.find.attr(o, d), h ?? void 0);
        }
      },
      attrHooks: {
        type: {
          set: function(o, d) {
            if (!L.radioValue && d === "radio" && O(o, "input")) {
              var m = o.value;
              return o.setAttribute("type", d), m && (o.value = m), d;
            }
          }
        }
      },
      removeAttr: function(o, d) {
        var m, h = 0, b = d && d.match(rt);
        if (b && o.nodeType === 1)
          for (; m = b[h++]; )
            o.removeAttribute(m);
      }
    }), me = {
      set: function(o, d, m) {
        return d === !1 ? f.removeAttr(o, m) : o.setAttribute(m, m), m;
      }
    }, f.each(f.expr.match.bool.source.match(/\w+/g), function(o, d) {
      var m = ve[d] || f.find.attr;
      ve[d] = function(h, b, w) {
        var S, M, I = b.toLowerCase();
        return w || (M = ve[I], ve[I] = S, S = m(h, b, w) != null ? I : null, ve[I] = M), S;
      };
    });
    var Ye = /^(?:input|select|textarea|button)$/i, Pe = /^(?:a|area)$/i;
    f.fn.extend({
      prop: function(o, d) {
        return we(this, f.prop, o, d, arguments.length > 1);
      },
      removeProp: function(o) {
        return this.each(function() {
          delete this[f.propFix[o] || o];
        });
      }
    }), f.extend({
      prop: function(o, d, m) {
        var h, b, w = o.nodeType;
        if (!(w === 3 || w === 8 || w === 2))
          return (w !== 1 || !f.isXMLDoc(o)) && (d = f.propFix[d] || d, b = f.propHooks[d]), m !== void 0 ? b && "set" in b && (h = b.set(o, m, d)) !== void 0 ? h : o[d] = m : b && "get" in b && (h = b.get(o, d)) !== null ? h : o[d];
      },
      propHooks: {
        tabIndex: {
          get: function(o) {
            var d = f.find.attr(o, "tabindex");
            return d ? parseInt(d, 10) : Ye.test(o.nodeName) || Pe.test(o.nodeName) && o.href ? 0 : -1;
          }
        }
      },
      propFix: {
        for: "htmlFor",
        class: "className"
      }
    }), L.optSelected || (f.propHooks.selected = {
      get: function(o) {
        var d = o.parentNode;
        return d && d.parentNode && d.parentNode.selectedIndex, null;
      },
      set: function(o) {
        var d = o.parentNode;
        d && (d.selectedIndex, d.parentNode && d.parentNode.selectedIndex);
      }
    }), f.each([
      "tabIndex",
      "readOnly",
      "maxLength",
      "cellSpacing",
      "cellPadding",
      "rowSpan",
      "colSpan",
      "useMap",
      "frameBorder",
      "contentEditable"
    ], function() {
      f.propFix[this.toLowerCase()] = this;
    });
    function Ce(o) {
      var d = o.match(rt) || [];
      return d.join(" ");
    }
    function ft(o) {
      return o.getAttribute && o.getAttribute("class") || "";
    }
    function _t(o) {
      return Array.isArray(o) ? o : typeof o == "string" ? o.match(rt) || [] : [];
    }
    f.fn.extend({
      addClass: function(o) {
        var d, m, h, b, w, S;
        return x(o) ? this.each(function(M) {
          f(this).addClass(o.call(this, M, ft(this)));
        }) : (d = _t(o), d.length ? this.each(function() {
          if (h = ft(this), m = this.nodeType === 1 && " " + Ce(h) + " ", m) {
            for (w = 0; w < d.length; w++)
              b = d[w], m.indexOf(" " + b + " ") < 0 && (m += b + " ");
            S = Ce(m), h !== S && this.setAttribute("class", S);
          }
        }) : this);
      },
      removeClass: function(o) {
        var d, m, h, b, w, S;
        return x(o) ? this.each(function(M) {
          f(this).removeClass(o.call(this, M, ft(this)));
        }) : arguments.length ? (d = _t(o), d.length ? this.each(function() {
          if (h = ft(this), m = this.nodeType === 1 && " " + Ce(h) + " ", m) {
            for (w = 0; w < d.length; w++)
              for (b = d[w]; m.indexOf(" " + b + " ") > -1; )
                m = m.replace(" " + b + " ", " ");
            S = Ce(m), h !== S && this.setAttribute("class", S);
          }
        }) : this) : this.attr("class", "");
      },
      toggleClass: function(o, d) {
        var m, h, b, w, S = typeof o, M = S === "string" || Array.isArray(o);
        return x(o) ? this.each(function(I) {
          f(this).toggleClass(
            o.call(this, I, ft(this), d),
            d
          );
        }) : typeof d == "boolean" && M ? d ? this.addClass(o) : this.removeClass(o) : (m = _t(o), this.each(function() {
          if (M)
            for (w = f(this), b = 0; b < m.length; b++)
              h = m[b], w.hasClass(h) ? w.removeClass(h) : w.addClass(h);
          else (o === void 0 || S === "boolean") && (h = ft(this), h && G.set(this, "__className__", h), this.setAttribute && this.setAttribute(
            "class",
            h || o === !1 ? "" : G.get(this, "__className__") || ""
          ));
        }));
      },
      hasClass: function(o) {
        var d, m, h = 0;
        for (d = " " + o + " "; m = this[h++]; )
          if (m.nodeType === 1 && (" " + Ce(ft(m)) + " ").indexOf(d) > -1)
            return !0;
        return !1;
      }
    });
    var en = /\r/g;
    f.fn.extend({
      val: function(o) {
        var d, m, h, b = this[0];
        return arguments.length ? (h = x(o), this.each(function(w) {
          var S;
          this.nodeType === 1 && (h ? S = o.call(this, w, f(this).val()) : S = o, S == null ? S = "" : typeof S == "number" ? S += "" : Array.isArray(S) && (S = f.map(S, function(M) {
            return M == null ? "" : M + "";
          })), d = f.valHooks[this.type] || f.valHooks[this.nodeName.toLowerCase()], (!d || !("set" in d) || d.set(this, S, "value") === void 0) && (this.value = S));
        })) : b ? (d = f.valHooks[b.type] || f.valHooks[b.nodeName.toLowerCase()], d && "get" in d && (m = d.get(b, "value")) !== void 0 ? m : (m = b.value, typeof m == "string" ? m.replace(en, "") : m ?? "")) : void 0;
      }
    }), f.extend({
      valHooks: {
        option: {
          get: function(o) {
            var d = f.find.attr(o, "value");
            return d ?? // Support: IE <=10 - 11 only
            // option.text throws exceptions (trac-14686, trac-14858)
            // Strip and collapse whitespace
            // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
            Ce(f.text(o));
          }
        },
        select: {
          get: function(o) {
            var d, m, h, b = o.options, w = o.selectedIndex, S = o.type === "select-one", M = S ? null : [], I = S ? w + 1 : b.length;
            for (w < 0 ? h = I : h = S ? w : 0; h < I; h++)
              if (m = b[h], (m.selected || h === w) && // Don't return options that are disabled or in a disabled optgroup
              !m.disabled && (!m.parentNode.disabled || !O(m.parentNode, "optgroup"))) {
                if (d = f(m).val(), S)
                  return d;
                M.push(d);
              }
            return M;
          },
          set: function(o, d) {
            for (var m, h, b = o.options, w = f.makeArray(d), S = b.length; S--; )
              h = b[S], (h.selected = f.inArray(f.valHooks.option.get(h), w) > -1) && (m = !0);
            return m || (o.selectedIndex = -1), w;
          }
        }
      }
    }), f.each(["radio", "checkbox"], function() {
      f.valHooks[this] = {
        set: function(o, d) {
          if (Array.isArray(d))
            return o.checked = f.inArray(f(o).val(), d) > -1;
        }
      }, L.checkOn || (f.valHooks[this].get = function(o) {
        return o.getAttribute("value") === null ? "on" : o.value;
      });
    });
    var jt = t.location, wn = { guid: Date.now() }, qt = /\?/;
    f.parseXML = function(o) {
      var d, m;
      if (!o || typeof o != "string")
        return null;
      try {
        d = new t.DOMParser().parseFromString(o, "text/xml");
      } catch {
      }
      return m = d && d.getElementsByTagName("parsererror")[0], (!d || m) && f.error("Invalid XML: " + (m ? f.map(m.childNodes, function(h) {
        return h.textContent;
      }).join(`
`) : o)), d;
    };
    var Ln = /^(?:focusinfocus|focusoutblur)$/, Pr = function(o) {
      o.stopPropagation();
    };
    f.extend(f.event, {
      trigger: function(o, d, m, h) {
        var b, w, S, M, I, B, Y, Q, z = [m || T], ce = v.call(o, "type") ? o.type : o, Je = v.call(o, "namespace") ? o.namespace.split(".") : [];
        if (w = Q = S = m = m || T, !(m.nodeType === 3 || m.nodeType === 8) && !Ln.test(ce + f.event.triggered) && (ce.indexOf(".") > -1 && (Je = ce.split("."), ce = Je.shift(), Je.sort()), I = ce.indexOf(":") < 0 && "on" + ce, o = o[f.expando] ? o : new f.Event(ce, typeof o == "object" && o), o.isTrigger = h ? 2 : 3, o.namespace = Je.join("."), o.rnamespace = o.namespace ? new RegExp("(^|\\.)" + Je.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, o.result = void 0, o.target || (o.target = m), d = d == null ? [o] : f.makeArray(d, [o]), Y = f.event.special[ce] || {}, !(!h && Y.trigger && Y.trigger.apply(m, d) === !1))) {
          if (!h && !Y.noBubble && !C(m)) {
            for (M = Y.delegateType || ce, Ln.test(M + ce) || (w = w.parentNode); w; w = w.parentNode)
              z.push(w), S = w;
            S === (m.ownerDocument || T) && z.push(S.defaultView || S.parentWindow || t);
          }
          for (b = 0; (w = z[b++]) && !o.isPropagationStopped(); )
            Q = w, o.type = b > 1 ? M : Y.bindType || ce, B = (G.get(w, "events") || /* @__PURE__ */ Object.create(null))[o.type] && G.get(w, "handle"), B && B.apply(w, d), B = I && w[I], B && B.apply && et(w) && (o.result = B.apply(w, d), o.result === !1 && o.preventDefault());
          return o.type = ce, !h && !o.isDefaultPrevented() && (!Y._default || Y._default.apply(z.pop(), d) === !1) && et(m) && I && x(m[ce]) && !C(m) && (S = m[I], S && (m[I] = null), f.event.triggered = ce, o.isPropagationStopped() && Q.addEventListener(ce, Pr), m[ce](), o.isPropagationStopped() && Q.removeEventListener(ce, Pr), f.event.triggered = void 0, S && (m[I] = S)), o.result;
        }
      },
      // Piggyback on a donor event to simulate a different one
      // Used only for `focus(in | out)` events
      simulate: function(o, d, m) {
        var h = f.extend(
          new f.Event(),
          m,
          {
            type: o,
            isSimulated: !0
          }
        );
        f.event.trigger(h, null, d);
      }
    }), f.fn.extend({
      trigger: function(o, d) {
        return this.each(function() {
          f.event.trigger(o, d, this);
        });
      },
      triggerHandler: function(o, d) {
        var m = this[0];
        if (m)
          return f.event.trigger(o, d, m, !0);
      }
    });
    var Ta = /\[\]$/, Nr = /\r?\n/g, Bn = /^(?:submit|button|image|reset|file)$/i, ar = /^(?:input|select|textarea|keygen)/i;
    function jo(o, d, m, h) {
      var b;
      if (Array.isArray(d))
        f.each(d, function(w, S) {
          m || Ta.test(o) ? h(o, S) : jo(
            o + "[" + (typeof S == "object" && S != null ? w : "") + "]",
            S,
            m,
            h
          );
        });
      else if (!m && N(d) === "object")
        for (b in d)
          jo(o + "[" + b + "]", d[b], m, h);
      else
        h(o, d);
    }
    f.param = function(o, d) {
      var m, h = [], b = function(w, S) {
        var M = x(S) ? S() : S;
        h[h.length] = encodeURIComponent(w) + "=" + encodeURIComponent(M ?? "");
      };
      if (o == null)
        return "";
      if (Array.isArray(o) || o.jquery && !f.isPlainObject(o))
        f.each(o, function() {
          b(this.name, this.value);
        });
      else
        for (m in o)
          jo(m, o[m], d, b);
      return h.join("&");
    }, f.fn.extend({
      serialize: function() {
        return f.param(this.serializeArray());
      },
      serializeArray: function() {
        return this.map(function() {
          var o = f.prop(this, "elements");
          return o ? f.makeArray(o) : this;
        }).filter(function() {
          var o = this.type;
          return this.name && !f(this).is(":disabled") && ar.test(this.nodeName) && !Bn.test(o) && (this.checked || !Xt.test(o));
        }).map(function(o, d) {
          var m = f(this).val();
          return m == null ? null : Array.isArray(m) ? f.map(m, function(h) {
            return { name: d.name, value: h.replace(Nr, `\r
`) };
          }) : { name: d.name, value: m.replace(Nr, `\r
`) };
        }).get();
      }
    });
    var qp = /%20/g, Wp = /#.*$/, Yp = /([?&])_=[^&]*/, Gp = /^(.*?):[ \t]*([^\r\n]*)$/mg, Kp = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, Jp = /^(?:GET|HEAD)$/, Qp = /^\/\//, fc = {}, Vo = {}, pc = "*/".concat("*"), Uo = T.createElement("a");
    Uo.href = jt.href;
    function mc(o) {
      return function(d, m) {
        typeof d != "string" && (m = d, d = "*");
        var h, b = 0, w = d.toLowerCase().match(rt) || [];
        if (x(m))
          for (; h = w[b++]; )
            h[0] === "+" ? (h = h.slice(1) || "*", (o[h] = o[h] || []).unshift(m)) : (o[h] = o[h] || []).push(m);
      };
    }
    function gc(o, d, m, h) {
      var b = {}, w = o === Vo;
      function S(M) {
        var I;
        return b[M] = !0, f.each(o[M] || [], function(B, Y) {
          var Q = Y(d, m, h);
          if (typeof Q == "string" && !w && !b[Q])
            return d.dataTypes.unshift(Q), S(Q), !1;
          if (w)
            return !(I = Q);
        }), I;
      }
      return S(d.dataTypes[0]) || !b["*"] && S("*");
    }
    function Bo(o, d) {
      var m, h, b = f.ajaxSettings.flatOptions || {};
      for (m in d)
        d[m] !== void 0 && ((b[m] ? o : h || (h = {}))[m] = d[m]);
      return h && f.extend(!0, o, h), o;
    }
    function Xp(o, d, m) {
      for (var h, b, w, S, M = o.contents, I = o.dataTypes; I[0] === "*"; )
        I.shift(), h === void 0 && (h = o.mimeType || d.getResponseHeader("Content-Type"));
      if (h) {
        for (b in M)
          if (M[b] && M[b].test(h)) {
            I.unshift(b);
            break;
          }
      }
      if (I[0] in m)
        w = I[0];
      else {
        for (b in m) {
          if (!I[0] || o.converters[b + " " + I[0]]) {
            w = b;
            break;
          }
          S || (S = b);
        }
        w = w || S;
      }
      if (w)
        return w !== I[0] && I.unshift(w), m[w];
    }
    function Zp(o, d, m, h) {
      var b, w, S, M, I, B = {}, Y = o.dataTypes.slice();
      if (Y[1])
        for (S in o.converters)
          B[S.toLowerCase()] = o.converters[S];
      for (w = Y.shift(); w; )
        if (o.responseFields[w] && (m[o.responseFields[w]] = d), !I && h && o.dataFilter && (d = o.dataFilter(d, o.dataType)), I = w, w = Y.shift(), w) {
          if (w === "*")
            w = I;
          else if (I !== "*" && I !== w) {
            if (S = B[I + " " + w] || B["* " + w], !S) {
              for (b in B)
                if (M = b.split(" "), M[1] === w && (S = B[I + " " + M[0]] || B["* " + M[0]], S)) {
                  S === !0 ? S = B[b] : B[b] !== !0 && (w = M[0], Y.unshift(M[1]));
                  break;
                }
            }
            if (S !== !0)
              if (S && o.throws)
                d = S(d);
              else
                try {
                  d = S(d);
                } catch (Q) {
                  return {
                    state: "parsererror",
                    error: S ? Q : "No conversion from " + I + " to " + w
                  };
                }
          }
        }
      return { state: "success", data: d };
    }
    f.extend({
      // Counter for holding the number of active queries
      active: 0,
      // Last-Modified header cache for next request
      lastModified: {},
      etag: {},
      ajaxSettings: {
        url: jt.href,
        type: "GET",
        isLocal: Kp.test(jt.protocol),
        global: !0,
        processData: !0,
        async: !0,
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        /*
        timeout: 0,
        data: null,
        dataType: null,
        username: null,
        password: null,
        cache: null,
        throws: false,
        traditional: false,
        headers: {},
        */
        accepts: {
          "*": pc,
          text: "text/plain",
          html: "text/html",
          xml: "application/xml, text/xml",
          json: "application/json, text/javascript"
        },
        contents: {
          xml: /\bxml\b/,
          html: /\bhtml/,
          json: /\bjson\b/
        },
        responseFields: {
          xml: "responseXML",
          text: "responseText",
          json: "responseJSON"
        },
        // Data converters
        // Keys separate source (or catchall "*") and destination types with a single space
        converters: {
          // Convert anything to text
          "* text": String,
          // Text to html (true = no transformation)
          "text html": !0,
          // Evaluate text as a json expression
          "text json": JSON.parse,
          // Parse text as xml
          "text xml": f.parseXML
        },
        // For options that shouldn't be deep extended:
        // you can add your own custom options here if
        // and when you create one that shouldn't be
        // deep extended (see ajaxExtend)
        flatOptions: {
          url: !0,
          context: !0
        }
      },
      // Creates a full fledged settings object into target
      // with both ajaxSettings and settings fields.
      // If target is omitted, writes into ajaxSettings.
      ajaxSetup: function(o, d) {
        return d ? (
          // Building a settings object
          Bo(Bo(o, f.ajaxSettings), d)
        ) : (
          // Extending ajaxSettings
          Bo(f.ajaxSettings, o)
        );
      },
      ajaxPrefilter: mc(fc),
      ajaxTransport: mc(Vo),
      // Main method
      ajax: function(o, d) {
        typeof o == "object" && (d = o, o = void 0), d = d || {};
        var m, h, b, w, S, M, I, B, Y, Q, z = f.ajaxSetup({}, d), ce = z.context || z, Je = z.context && (ce.nodeType || ce.jquery) ? f(ce) : f.event, pt = f.Deferred(), it = f.Callbacks("once memory"), ln = z.statusCode || {}, tn = {}, Hn = {}, zn = "canceled", ut = {
          readyState: 0,
          // Builds headers hashtable if needed
          getResponseHeader: function(ht) {
            var Vt;
            if (I) {
              if (!w)
                for (w = {}; Vt = Gp.exec(b); )
                  w[Vt[1].toLowerCase() + " "] = (w[Vt[1].toLowerCase() + " "] || []).concat(Vt[2]);
              Vt = w[ht.toLowerCase() + " "];
            }
            return Vt == null ? null : Vt.join(", ");
          },
          // Raw string
          getAllResponseHeaders: function() {
            return I ? b : null;
          },
          // Caches the header
          setRequestHeader: function(ht, Vt) {
            return I == null && (ht = Hn[ht.toLowerCase()] = Hn[ht.toLowerCase()] || ht, tn[ht] = Vt), this;
          },
          // Overrides response content-type header
          overrideMimeType: function(ht) {
            return I == null && (z.mimeType = ht), this;
          },
          // Status-dependent callbacks
          statusCode: function(ht) {
            var Vt;
            if (ht)
              if (I)
                ut.always(ht[ut.status]);
              else
                for (Vt in ht)
                  ln[Vt] = [ln[Vt], ht[Vt]];
            return this;
          },
          // Cancel the request
          abort: function(ht) {
            var Vt = ht || zn;
            return m && m.abort(Vt), Rr(0, Vt), this;
          }
        };
        if (pt.promise(ut), z.url = ((o || z.url || jt.href) + "").replace(Qp, jt.protocol + "//"), z.type = d.method || d.type || z.method || z.type, z.dataTypes = (z.dataType || "*").toLowerCase().match(rt) || [""], z.crossDomain == null) {
          M = T.createElement("a");
          try {
            M.href = z.url, M.href = M.href, z.crossDomain = Uo.protocol + "//" + Uo.host != M.protocol + "//" + M.host;
          } catch {
            z.crossDomain = !0;
          }
        }
        if (z.data && z.processData && typeof z.data != "string" && (z.data = f.param(z.data, z.traditional)), gc(fc, z, d, ut), I)
          return ut;
        B = f.event && z.global, B && f.active++ === 0 && f.event.trigger("ajaxStart"), z.type = z.type.toUpperCase(), z.hasContent = !Jp.test(z.type), h = z.url.replace(Wp, ""), z.hasContent ? z.data && z.processData && (z.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && (z.data = z.data.replace(qp, "+")) : (Q = z.url.slice(h.length), z.data && (z.processData || typeof z.data == "string") && (h += (qt.test(h) ? "&" : "?") + z.data, delete z.data), z.cache === !1 && (h = h.replace(Yp, "$1"), Q = (qt.test(h) ? "&" : "?") + "_=" + wn.guid++ + Q), z.url = h + Q), z.ifModified && (f.lastModified[h] && ut.setRequestHeader("If-Modified-Since", f.lastModified[h]), f.etag[h] && ut.setRequestHeader("If-None-Match", f.etag[h])), (z.data && z.hasContent && z.contentType !== !1 || d.contentType) && ut.setRequestHeader("Content-Type", z.contentType), ut.setRequestHeader(
          "Accept",
          z.dataTypes[0] && z.accepts[z.dataTypes[0]] ? z.accepts[z.dataTypes[0]] + (z.dataTypes[0] !== "*" ? ", " + pc + "; q=0.01" : "") : z.accepts["*"]
        );
        for (Y in z.headers)
          ut.setRequestHeader(Y, z.headers[Y]);
        if (z.beforeSend && (z.beforeSend.call(ce, ut, z) === !1 || I))
          return ut.abort();
        if (zn = "abort", it.add(z.complete), ut.done(z.success), ut.fail(z.error), m = gc(Vo, z, d, ut), !m)
          Rr(-1, "No Transport");
        else {
          if (ut.readyState = 1, B && Je.trigger("ajaxSend", [ut, z]), I)
            return ut;
          z.async && z.timeout > 0 && (S = t.setTimeout(function() {
            ut.abort("timeout");
          }, z.timeout));
          try {
            I = !1, m.send(tn, Rr);
          } catch (ht) {
            if (I)
              throw ht;
            Rr(-1, ht);
          }
        }
        function Rr(ht, Vt, ka, zo) {
          var qn, Pa, Wn, gr, hr, An = Vt;
          I || (I = !0, S && t.clearTimeout(S), m = void 0, b = zo || "", ut.readyState = ht > 0 ? 4 : 0, qn = ht >= 200 && ht < 300 || ht === 304, ka && (gr = Xp(z, ut, ka)), !qn && f.inArray("script", z.dataTypes) > -1 && f.inArray("json", z.dataTypes) < 0 && (z.converters["text script"] = function() {
          }), gr = Zp(z, gr, ut, qn), qn ? (z.ifModified && (hr = ut.getResponseHeader("Last-Modified"), hr && (f.lastModified[h] = hr), hr = ut.getResponseHeader("etag"), hr && (f.etag[h] = hr)), ht === 204 || z.type === "HEAD" ? An = "nocontent" : ht === 304 ? An = "notmodified" : (An = gr.state, Pa = gr.data, Wn = gr.error, qn = !Wn)) : (Wn = An, (ht || !An) && (An = "error", ht < 0 && (ht = 0))), ut.status = ht, ut.statusText = (Vt || An) + "", qn ? pt.resolveWith(ce, [Pa, An, ut]) : pt.rejectWith(ce, [ut, An, Wn]), ut.statusCode(ln), ln = void 0, B && Je.trigger(
            qn ? "ajaxSuccess" : "ajaxError",
            [ut, z, qn ? Pa : Wn]
          ), it.fireWith(ce, [ut, An]), B && (Je.trigger("ajaxComplete", [ut, z]), --f.active || f.event.trigger("ajaxStop")));
        }
        return ut;
      },
      getJSON: function(o, d, m) {
        return f.get(o, d, m, "json");
      },
      getScript: function(o, d) {
        return f.get(o, void 0, d, "script");
      }
    }), f.each(["get", "post"], function(o, d) {
      f[d] = function(m, h, b, w) {
        return x(h) && (w = w || b, b = h, h = void 0), f.ajax(f.extend({
          url: m,
          type: d,
          dataType: w,
          data: h,
          success: b
        }, f.isPlainObject(m) && m));
      };
    }), f.ajaxPrefilter(function(o) {
      var d;
      for (d in o.headers)
        d.toLowerCase() === "content-type" && (o.contentType = o.headers[d] || "");
    }), f._evalUrl = function(o, d, m) {
      return f.ajax({
        url: o,
        // Make this explicit, since user can override this through ajaxSetup (trac-11264)
        type: "GET",
        dataType: "script",
        cache: !0,
        async: !1,
        global: !1,
        // Only evaluate the response if it is successful (gh-4126)
        // dataFilter is not invoked for failure responses, so using it instead
        // of the default converter is kludgy but it works.
        converters: {
          "text script": function() {
          }
        },
        dataFilter: function(h) {
          f.globalEval(h, d, m);
        }
      });
    }, f.fn.extend({
      wrapAll: function(o) {
        var d;
        return this[0] && (x(o) && (o = o.call(this[0])), d = f(o, this[0].ownerDocument).eq(0).clone(!0), this[0].parentNode && d.insertBefore(this[0]), d.map(function() {
          for (var m = this; m.firstElementChild; )
            m = m.firstElementChild;
          return m;
        }).append(this)), this;
      },
      wrapInner: function(o) {
        return x(o) ? this.each(function(d) {
          f(this).wrapInner(o.call(this, d));
        }) : this.each(function() {
          var d = f(this), m = d.contents();
          m.length ? m.wrapAll(o) : d.append(o);
        });
      },
      wrap: function(o) {
        var d = x(o);
        return this.each(function(m) {
          f(this).wrapAll(d ? o.call(this, m) : o);
        });
      },
      unwrap: function(o) {
        return this.parent(o).not("body").each(function() {
          f(this).replaceWith(this.childNodes);
        }), this;
      }
    }), f.expr.pseudos.hidden = function(o) {
      return !f.expr.pseudos.visible(o);
    }, f.expr.pseudos.visible = function(o) {
      return !!(o.offsetWidth || o.offsetHeight || o.getClientRects().length);
    }, f.ajaxSettings.xhr = function() {
      try {
        return new t.XMLHttpRequest();
      } catch {
      }
    };
    var em = {
      // File protocol always yields status code 0, assume 200
      0: 200,
      // Support: IE <=9 only
      // trac-1450: sometimes IE returns 1223 when it should be 204
      1223: 204
    }, Da = f.ajaxSettings.xhr();
    L.cors = !!Da && "withCredentials" in Da, L.ajax = Da = !!Da, f.ajaxTransport(function(o) {
      var d, m;
      if (L.cors || Da && !o.crossDomain)
        return {
          send: function(h, b) {
            var w, S = o.xhr();
            if (S.open(
              o.type,
              o.url,
              o.async,
              o.username,
              o.password
            ), o.xhrFields)
              for (w in o.xhrFields)
                S[w] = o.xhrFields[w];
            o.mimeType && S.overrideMimeType && S.overrideMimeType(o.mimeType), !o.crossDomain && !h["X-Requested-With"] && (h["X-Requested-With"] = "XMLHttpRequest");
            for (w in h)
              S.setRequestHeader(w, h[w]);
            d = function(M) {
              return function() {
                d && (d = m = S.onload = S.onerror = S.onabort = S.ontimeout = S.onreadystatechange = null, M === "abort" ? S.abort() : M === "error" ? typeof S.status != "number" ? b(0, "error") : b(
                  // File: protocol always yields status 0; see trac-8605, trac-14207
                  S.status,
                  S.statusText
                ) : b(
                  em[S.status] || S.status,
                  S.statusText,
                  // Support: IE <=9 only
                  // IE9 has no XHR2 but throws on binary (trac-11426)
                  // For XHR2 non-text, let the caller handle it (gh-2498)
                  (S.responseType || "text") !== "text" || typeof S.responseText != "string" ? { binary: S.response } : { text: S.responseText },
                  S.getAllResponseHeaders()
                ));
              };
            }, S.onload = d(), m = S.onerror = S.ontimeout = d("error"), S.onabort !== void 0 ? S.onabort = m : S.onreadystatechange = function() {
              S.readyState === 4 && t.setTimeout(function() {
                d && m();
              });
            }, d = d("abort");
            try {
              S.send(o.hasContent && o.data || null);
            } catch (M) {
              if (d)
                throw M;
            }
          },
          abort: function() {
            d && d();
          }
        };
    }), f.ajaxPrefilter(function(o) {
      o.crossDomain && (o.contents.script = !1);
    }), f.ajaxSetup({
      accepts: {
        script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
      },
      contents: {
        script: /\b(?:java|ecma)script\b/
      },
      converters: {
        "text script": function(o) {
          return f.globalEval(o), o;
        }
      }
    }), f.ajaxPrefilter("script", function(o) {
      o.cache === void 0 && (o.cache = !1), o.crossDomain && (o.type = "GET");
    }), f.ajaxTransport("script", function(o) {
      if (o.crossDomain || o.scriptAttrs) {
        var d, m;
        return {
          send: function(h, b) {
            d = f("<script>").attr(o.scriptAttrs || {}).prop({ charset: o.scriptCharset, src: o.url }).on("load error", m = function(w) {
              d.remove(), m = null, w && b(w.type === "error" ? 404 : 200, w.type);
            }), T.head.appendChild(d[0]);
          },
          abort: function() {
            m && m();
          }
        };
      }
    });
    var hc = [], Ho = /(=)\?(?=&|$)|\?\?/;
    f.ajaxSetup({
      jsonp: "callback",
      jsonpCallback: function() {
        var o = hc.pop() || f.expando + "_" + wn.guid++;
        return this[o] = !0, o;
      }
    }), f.ajaxPrefilter("json jsonp", function(o, d, m) {
      var h, b, w, S = o.jsonp !== !1 && (Ho.test(o.url) ? "url" : typeof o.data == "string" && (o.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && Ho.test(o.data) && "data");
      if (S || o.dataTypes[0] === "jsonp")
        return h = o.jsonpCallback = x(o.jsonpCallback) ? o.jsonpCallback() : o.jsonpCallback, S ? o[S] = o[S].replace(Ho, "$1" + h) : o.jsonp !== !1 && (o.url += (qt.test(o.url) ? "&" : "?") + o.jsonp + "=" + h), o.converters["script json"] = function() {
          return w || f.error(h + " was not called"), w[0];
        }, o.dataTypes[0] = "json", b = t[h], t[h] = function() {
          w = arguments;
        }, m.always(function() {
          b === void 0 ? f(t).removeProp(h) : t[h] = b, o[h] && (o.jsonpCallback = d.jsonpCallback, hc.push(h)), w && x(b) && b(w[0]), w = b = void 0;
        }), "script";
    }), L.createHTMLDocument = function() {
      var o = T.implementation.createHTMLDocument("").body;
      return o.innerHTML = "<form></form><form></form>", o.childNodes.length === 2;
    }(), f.parseHTML = function(o, d, m) {
      if (typeof o != "string")
        return [];
      typeof d == "boolean" && (m = d, d = !1);
      var h, b, w;
      return d || (L.createHTMLDocument ? (d = T.implementation.createHTMLDocument(""), h = d.createElement("base"), h.href = T.location.href, d.head.appendChild(h)) : d = T), b = Ne.exec(o), w = !m && [], b ? [d.createElement(b[1])] : (b = Tt([o], d, w), w && w.length && f(w).remove(), f.merge([], b.childNodes));
    }, f.fn.load = function(o, d, m) {
      var h, b, w, S = this, M = o.indexOf(" ");
      return M > -1 && (h = Ce(o.slice(M)), o = o.slice(0, M)), x(d) ? (m = d, d = void 0) : d && typeof d == "object" && (b = "POST"), S.length > 0 && f.ajax({
        url: o,
        // If "type" variable is undefined, then "GET" method will be used.
        // Make value of this field explicit since
        // user can override it through ajaxSetup method
        type: b || "GET",
        dataType: "html",
        data: d
      }).done(function(I) {
        w = arguments, S.html(h ? (
          // If a selector was specified, locate the right elements in a dummy div
          // Exclude scripts to avoid IE 'Permission Denied' errors
          f("<div>").append(f.parseHTML(I)).find(h)
        ) : (
          // Otherwise use the full result
          I
        ));
      }).always(m && function(I, B) {
        S.each(function() {
          m.apply(this, w || [I.responseText, B, I]);
        });
      }), this;
    }, f.expr.pseudos.animated = function(o) {
      return f.grep(f.timers, function(d) {
        return o === d.elem;
      }).length;
    }, f.offset = {
      setOffset: function(o, d, m) {
        var h, b, w, S, M, I, B, Y = f.css(o, "position"), Q = f(o), z = {};
        Y === "static" && (o.style.position = "relative"), M = Q.offset(), w = f.css(o, "top"), I = f.css(o, "left"), B = (Y === "absolute" || Y === "fixed") && (w + I).indexOf("auto") > -1, B ? (h = Q.position(), S = h.top, b = h.left) : (S = parseFloat(w) || 0, b = parseFloat(I) || 0), x(d) && (d = d.call(o, m, f.extend({}, M))), d.top != null && (z.top = d.top - M.top + S), d.left != null && (z.left = d.left - M.left + b), "using" in d ? d.using.call(o, z) : Q.css(z);
      }
    }, f.fn.extend({
      // offset() relates an element's border box to the document origin
      offset: function(o) {
        if (arguments.length)
          return o === void 0 ? this : this.each(function(b) {
            f.offset.setOffset(this, o, b);
          });
        var d, m, h = this[0];
        if (h)
          return h.getClientRects().length ? (d = h.getBoundingClientRect(), m = h.ownerDocument.defaultView, {
            top: d.top + m.pageYOffset,
            left: d.left + m.pageXOffset
          }) : { top: 0, left: 0 };
      },
      // position() relates an element's margin box to its offset parent's padding box
      // This corresponds to the behavior of CSS absolute positioning
      position: function() {
        if (this[0]) {
          var o, d, m, h = this[0], b = { top: 0, left: 0 };
          if (f.css(h, "position") === "fixed")
            d = h.getBoundingClientRect();
          else {
            for (d = this.offset(), m = h.ownerDocument, o = h.offsetParent || m.documentElement; o && (o === m.body || o === m.documentElement) && f.css(o, "position") === "static"; )
              o = o.parentNode;
            o && o !== h && o.nodeType === 1 && (b = f(o).offset(), b.top += f.css(o, "borderTopWidth", !0), b.left += f.css(o, "borderLeftWidth", !0));
          }
          return {
            top: d.top - b.top - f.css(h, "marginTop", !0),
            left: d.left - b.left - f.css(h, "marginLeft", !0)
          };
        }
      },
      // This method will return documentElement in the following cases:
      // 1) For the element inside the iframe without offsetParent, this method will return
      //    documentElement of the parent window
      // 2) For the hidden or detached element
      // 3) For body or html element, i.e. in case of the html node - it will return itself
      //
      // but those exceptions were never presented as a real life use-cases
      // and might be considered as more preferable results.
      //
      // This logic, however, is not guaranteed and can change at any point in the future
      offsetParent: function() {
        return this.map(function() {
          for (var o = this.offsetParent; o && f.css(o, "position") === "static"; )
            o = o.offsetParent;
          return o || Ht;
        });
      }
    }), f.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function(o, d) {
      var m = d === "pageYOffset";
      f.fn[o] = function(h) {
        return we(this, function(b, w, S) {
          var M;
          if (C(b) ? M = b : b.nodeType === 9 && (M = b.defaultView), S === void 0)
            return M ? M[d] : b[w];
          M ? M.scrollTo(
            m ? M.pageXOffset : S,
            m ? S : M.pageYOffset
          ) : b[w] = S;
        }, o, h, arguments.length);
      };
    }), f.each(["top", "left"], function(o, d) {
      f.cssHooks[d] = Yr(
        L.pixelPosition,
        function(m, h) {
          if (h)
            return h = kr(m, d), ba.test(h) ? f(m).position()[d] + "px" : h;
        }
      );
    }), f.each({ Height: "height", Width: "width" }, function(o, d) {
      f.each({
        padding: "inner" + o,
        content: d,
        "": "outer" + o
      }, function(m, h) {
        f.fn[h] = function(b, w) {
          var S = arguments.length && (m || typeof b != "boolean"), M = m || (b === !0 || w === !0 ? "margin" : "border");
          return we(this, function(I, B, Y) {
            var Q;
            return C(I) ? h.indexOf("outer") === 0 ? I["inner" + o] : I.document.documentElement["client" + o] : I.nodeType === 9 ? (Q = I.documentElement, Math.max(
              I.body["scroll" + o],
              Q["scroll" + o],
              I.body["offset" + o],
              Q["offset" + o],
              Q["client" + o]
            )) : Y === void 0 ? (
              // Get width or height on the element, requesting but not forcing parseFloat
              f.css(I, B, M)
            ) : (
              // Set width or height on the element
              f.style(I, B, Y, M)
            );
          }, d, S ? b : void 0, S);
        };
      });
    }), f.each([
      "ajaxStart",
      "ajaxStop",
      "ajaxComplete",
      "ajaxError",
      "ajaxSuccess",
      "ajaxSend"
    ], function(o, d) {
      f.fn[d] = function(m) {
        return this.on(d, m);
      };
    }), f.fn.extend({
      bind: function(o, d, m) {
        return this.on(o, null, d, m);
      },
      unbind: function(o, d) {
        return this.off(o, null, d);
      },
      delegate: function(o, d, m, h) {
        return this.on(d, o, m, h);
      },
      undelegate: function(o, d, m) {
        return arguments.length === 1 ? this.off(o, "**") : this.off(d, o || "**", m);
      },
      hover: function(o, d) {
        return this.on("mouseenter", o).on("mouseleave", d || o);
      }
    }), f.each(
      "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),
      function(o, d) {
        f.fn[d] = function(m, h) {
          return arguments.length > 0 ? this.on(d, null, m, h) : this.trigger(d);
        };
      }
    );
    var tm = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;
    f.proxy = function(o, d) {
      var m, h, b;
      if (typeof d == "string" && (m = o[d], d = o, o = m), !!x(o))
        return h = i.call(arguments, 2), b = function() {
          return o.apply(d || this, h.concat(i.call(arguments)));
        }, b.guid = o.guid = o.guid || f.guid++, b;
    }, f.holdReady = function(o) {
      o ? f.readyWait++ : f.ready(!0);
    }, f.isArray = Array.isArray, f.parseJSON = JSON.parse, f.nodeName = O, f.isFunction = x, f.isWindow = C, f.camelCase = he, f.type = N, f.now = Date.now, f.isNumeric = function(o) {
      var d = f.type(o);
      return (d === "number" || d === "string") && // parseFloat NaNs numeric-cast false positives ("")
      // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
      // subtraction forces infinities to NaN
      !isNaN(o - parseFloat(o));
    }, f.trim = function(o) {
      return o == null ? "" : (o + "").replace(tm, "$1");
    };
    var nm = t.jQuery, rm = t.$;
    return f.noConflict = function(o) {
      return t.$ === f && (t.$ = rm), o && t.jQuery === f && (t.jQuery = nm), f;
    }, typeof n > "u" && (t.jQuery = t.$ = f), f;
  });
})(zp);
var HT = zp.exports;
const ld = /* @__PURE__ */ no(HT);
let Li = null;
const ek = () => {
  const [e, t] = V(!1), [n, r] = V(""), [a, i] = V(""), { observer: s, onClose: c } = Br(), u = async () => {
    if (Li)
      return console.debug("Returning cached data."), Li;
    console.debug("Fetching Redirection Alert Messages from API");
    try {
      const C = await (await fetch("/o/c/redirectionalertmessages/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": Liferay.ThemeDisplay.getBCP47LanguageId()
        }
      })).json();
      return console.debug("Feature Configurations Details:", C), Li = (C == null ? void 0 : C.items) || [], Li;
    } catch (x) {
      return console.error("Error while fetching configurations:", x), [];
    }
  }, p = () => {
    r(""), i(""), c(), t(!1);
  }, g = () => t(!0), v = async (x) => {
    if (x.startsWith("/") || x.startsWith("./") || x.startsWith("../")) {
      console.log("Ignoring Internal Links"), window.open(x, "_blank");
      return;
    }
    if (!(new URL(x).origin != window.location.origin)) {
      console.log("Ignoring Internal Links"), window.open(x, "_blank");
      return;
    }
    r(""), i("");
    const T = await u(), D = T.find((N) => N.url === x);
    if (D) {
      r(D.alertMessage || D.defaultAlertMessage), i(x);
      return;
    }
    const k = T.find((N) => N.url === "EXTERNAL_URL");
    if (k) {
      const N = new URL(x).hostname;
      if ((k.allowedDomain ? k.allowedDomain.split(",").map((f) => f.trim()) : []).some((f) => N === f || N.endsWith(`.${f}`))) {
        window.open(x, "_blank", "noopener,noreferrer");
        return;
      }
      r(k.alertMessage || k.defaultAlertMessage), i(x);
      return;
    }
    console.log("Seems no default configuration available. Please create a entry for default Alert message with key - EXTERNAL_URL");
  }, y = (x, C) => {
    const T = x.href;
    if (console.log("Triggered URL: " + T), !T || T.startsWith("javascript:") || T === "#") {
      console.log("Ignoring JavaScript-based hyperlink.");
      return;
    }
    if (!(new URL(T).origin != window.location.origin)) {
      console.log("Ignoring Internal Links");
      return;
    }
    C.preventDefault(), v(T);
  }, E = () => {
    window.open(a, "_blank", "noopener,noreferrer"), t(!1), c();
  };
  ye(() => {
    window.OpenFormByType = v;
    const x = function(C) {
      y(this, C);
    };
    return ld(document).on("click", "a", x), () => {
      ld(document).off("click", "a", x);
    };
  }, []), ye(() => {
    if (!n) {
      console.warn("No Alert message available to display");
      return;
    }
    g(), F == null || F.announceScreenReaderMessage('External\x20site\x20alert\x20popup\x20opened\x2e');
  }, [n]);
  const L = (x) => {
    x.key === "Escape" && (x.preventDefault(), x.stopPropagation(), p());
  };
  return ye(() => {
    if (e) {
      const x = document.querySelector(".modal-external .modal-content");
      if (x) {
        const C = setInterval(() => {
          const T = document.querySelector(".modal-external .modal-content .modal-heading");
          T != null && T != null && (T.setAttribute("id", x.getAttribute("aria-labelledby")), clearInterval(C));
        }, 500);
      }
    }
  }, [e]), /* @__PURE__ */ l.createElement(l.Fragment, null, e && /* @__PURE__ */ l.createElement(
    hn,
    {
      observer: s,
      size: "sm",
      className: "modal-dialog-centered modal-wrapper modal-external",
      disableAutoClose: !0,
      onKeyDown: L
    },
    /* @__PURE__ */ l.createElement(hn.Body, { className: "p-0" }, /* @__PURE__ */ l.createElement("div", { className: "modal-body" }, /* @__PURE__ */ l.createElement("h2", { className: "modal-heading h4" }, 'External\x20Site\x20Alert'), /* @__PURE__ */ l.createElement("hr", { className: "mt-2 pt-1" }), /* @__PURE__ */ l.createElement("h3", { className: "mb-3 pb-1 h6" }, 'Income\x20Tax\x20Department'), /* @__PURE__ */ l.createElement(
      "p",
      {
        className: "mb-3",
        dangerouslySetInnerHTML: { __html: n || "" }
      }
    )), /* @__PURE__ */ l.createElement("div", { className: "modal-footer-section d-flex justify-content-between" }, /* @__PURE__ */ l.createElement("button", { type: "button", className: "btn btn-secondary", onClick: p }, 'Close'), /* @__PURE__ */ l.createElement("button", { type: "button", className: "btn btn-primary text-white", onClick: E }, 'Accept')))
  ));
};
class tk extends l.Component {
  constructor(t) {
    super(t), this.state = { hasError: !1, error: null };
  }
  static getDerivedStateFromError(t) {
    return { hasError: !0, error: t };
  }
  componentDidCatch(t, n) {
    console.error("Error caught by ErrorBoundary:", t, n);
  }
  render() {
    return this.state.hasError ? this.props.fallback || /* @__PURE__ */ l.createElement("h2", null, "Something went wrong.") : this.props.children;
  }
}
const nk = ({ error: e }) => /* @__PURE__ */ l.createElement("div", { className: "error-container alert alert-danger text-center w-50 mx-auto" }, /* @__PURE__ */ l.createElement("h3", null, "Something went wrong"), /* @__PURE__ */ l.createElement("p", null, (e == null ? void 0 : e.message) || "Unknown error occurred"), /* @__PURE__ */ l.createElement("button", { className: "btn btn-primary", onClick: () => window.location.reload() }, "Refresh Page")), zT = ({ featureConfig: e, isAll: t, excludeYears: n = "", defaultHindiYear: r = "" }) => {
  const [a, i] = V([]), [s, c] = V(null);
  return ye(() => {
    if (!(e != null && e.id)) return;
    (async () => {
      try {
        console.log("feature years --> ", n);
        let p = e != null && e.isAllYears ? await Ve.getObjectData("/o/c/yearassetcategories/", { pageSize: -1, sort: "year:desc" }) : await Ve.getFeaturedRelationship(e.id);
        if (!Array.isArray(p == null ? void 0 : p.items)) return;
        const g = (n || "").split(",").map((x) => x.trim()).filter(Boolean);
        let v = p.items.filter((x) => !g.includes(String(x.assetCategoryID))).map((x) => ({
          value: x.assetCategoryID,
          label: x.year
        }));
        v.sort((x, C) => {
          const T = parseInt(x.label);
          return parseInt(C.label) - T;
        }), t && v.unshift({ value: 0, label: 'All' }), i((x) => {
          const C = JSON.stringify(v), T = JSON.stringify(x);
          return C === T ? x : v;
        });
        let y = p.items.find(
          (x) => x.id === e.r_featureDefaultYear_c_yearAssetCategoryId
        );
        if (!v.some(
          (x) => x.value === (y == null ? void 0 : y.assetCategoryID)
        )) {
          const x = v.find((C) => C.value == r);
          x && (y = {
            assetCategoryID: x.value,
            year: x.label
          });
        }
        const L = y ? {
          value: y.assetCategoryID,
          label: y.year
        } : t ? { value: 0, label: 'All' } : v[0] || null;
        c(
          (x) => (x == null ? void 0 : x.value) === (L == null ? void 0 : L.value) ? x : L
        );
      } catch (p) {
        console.error("Error fetching featured years:", p);
      }
    })();
  }, [e == null ? void 0 : e.id, e == null ? void 0 : e.isAllYears, e == null ? void 0 : e.r_featureDefaultYear_c_yearAssetCategoryId, t]), rn(() => ({ yearOptions: a, defaultYear: s }), [a, s]);
}, rk = ({
  etdsConfigContext: e,
  handleYearChange: t,
  setIsOpen: n,
  selectedYear: r,
  resetSignal: a,
  setDefaultYearCallback: i,
  isAll: s,
  label: c = 'Year',
  excludeYears: u = "",
  defaultHindiYear: p = ""
}) => {
  const [g, v] = V(null), { featureConfig: y } = e, { yearOptions: E, defaultYear: L } = zT({
    featureConfig: y,
    isAll: s,
    excludeYears: u,
    defaultHindiYear: p
  });
  ye(() => {
    !r && L && (g == null ? void 0 : g.value) !== L.value && (v(L), t(L), i == null || i(L));
  }, [L, r]), ye(() => {
    r && r.value !== (g == null ? void 0 : g.value) && v(r);
  }, [r]), ye(() => {
    L && (g == null ? void 0 : g.value) !== L.value && v(L);
  }, [a]);
  const x = (C) => {
    v(C), t(C);
  };
  return /* @__PURE__ */ l.createElement(
    Sn,
    {
      options: E,
      handleChange: x,
      setIsOpen: n,
      value: g,
      label: c
    }
  );
}, qT = Liferay.Icons.spritemap, ak = ({ id: e = "captcha-input", onChange: t, errorSignal: n, captchByPassName: r, onStatusChange: a, isReloaded: i = !0, captchaError: s = 'Invalid\x20CAPTCHA\x2c\x20please\x20retry', placeholderText: c = 'Enter\x20CAPTCHA' }) => {
  const [u, p] = V(null), [g, v] = V(""), [y, E] = V(""), [L, x] = V(!1);
  let C = Ve.getHomePageUrl();
  const T = _e(null), D = () => {
    T.current && T.current.play();
  }, k = async () => {
    var f, _;
    try {
      const O = await Ve.getObjectData("/o/c/globalconfigurations", {});
      console.log("Response of captcha config is", O);
      const J = (_ = (f = O == null ? void 0 : O.items) == null ? void 0 : f[0]) == null ? void 0 : _.disableCaptcha;
      let ee = !1;
      if (Array.isArray(J) && r) {
        const ge = r.trim().toUpperCase();
        ee = J.some((ie) => {
          var $e, Se, xe, Te;
          const fe = (Se = ($e = ie == null ? void 0 : ie.key) == null ? void 0 : $e.trim()) == null ? void 0 : Se.toUpperCase(), be = (Te = (xe = ie == null ? void 0 : ie.name) == null ? void 0 : xe.trim()) == null ? void 0 : Te.toUpperCase();
          return fe === ge || be === ge;
        });
      }
      console.log(`Captcha disabled for feature [${r}]:`, ee), x(ee), typeof a == "function" && a({ captchaDisabled: ee }), ee ? t({ id: null, input: null }) : N(!0);
    } catch (O) {
      console.error("Error fetching captcha config", O);
    }
  }, N = async (f = !0) => {
    console.log("Fetching CAPTCHA...", f);
    try {
      const O = await (await fetch(`${C}/etds/captcha/getcaptcha`)).json();
      p(O), v(""), f && E(""), t({ id: O.id, input: "" }), setTimeout(() => {
        T.current && T.current.load();
      }, 100);
    } catch (_) {
      console.error("Failed to load CAPTCHA:", _);
    }
  };
  ye(() => {
    i && k();
  }, []), ye(() => {
    n && !L && (E(n), N(!1), document.querySelector("#" + e).focus());
  }, [n, L]);
  const R = (f) => {
    E("");
    const _ = f.target.value.replace(/\D/g, "");
    v(_), t({ id: u == null ? void 0 : u.id, input: _ });
  };
  if (L)
    return null;
  const A = () => {
    N(!0), F == null || F.announceScreenReaderMessage('Captcha\x20refreshed');
  };
  return /* @__PURE__ */ l.createElement(hl.Provider, { value: qT }, /* @__PURE__ */ l.createElement("div", { className: "captcha-box form-group-item" }, u && /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("label", { className: "control-label d-flex", htmlFor: e, title: 'Please\x20confirm\x20that\x20you\x20are\x20not\x20a\x20robot' }, 'Please\x20confirm\x20that\x20you\x20are\x20not\x20a\x20robot', " ", /* @__PURE__ */ l.createElement("span", { className: "text-danger ml-1", "aria-hidden": "true" }, "*")), /* @__PURE__ */ l.createElement(
    "audio",
    {
      controls: !0,
      ref: T,
      className: "captcha-audio-file d-none",
      key: u.audio
    },
    /* @__PURE__ */ l.createElement("source", { src: `data:audio/wav;base64,${u.audio}`, type: "audio/wav" }),
    'etds-your-browser-does-not-support-audio-playback'
  ), /* @__PURE__ */ l.createElement("div", { className: "captcha-view" }, /* @__PURE__ */ l.createElement("div", { className: "captcha-img" }, /* @__PURE__ */ l.createElement("img", { src: `data:image/png;base64,${u.image}`, alt: "CAPTCHA" })), /* @__PURE__ */ l.createElement("div", { className: "audio-refresh-button" }, /* @__PURE__ */ l.createElement(
    "button",
    {
      type: "button",
      className: "btn captcha-audio-btn",
      onClick: D,
      "aria-label": 'Play\x20Audio\x20Captcha'
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-audio-sm" })
  ), /* @__PURE__ */ l.createElement(
    "button",
    {
      onClick: () => A(),
      type: "button",
      className: "btn captcha-refresh-btn",
      "aria-label": 'Refresh\x20Captcha'
    },
    /* @__PURE__ */ l.createElement(re, { symbol: "etds-refresh-sm" })
  ))), /* @__PURE__ */ l.createElement("div", { className: `form-group-item ${y ? "error-wrapper" : ""}` }, /* @__PURE__ */ l.createElement(
    "input",
    {
      id: e,
      type: "text",
      inputMode: "numeric",
      pattern: "[0-9]*",
      value: g,
      onChange: R,
      placeholder: c,
      className: "form-control",
      "aria-label": 'Please\x20confirm\x20that\x20you\x20are\x20not\x20a\x20robot',
      "aria-required": "true"
    }
  ), y && /* @__PURE__ */ l.createElement("span", { "aria-live": "assertive", role: "alert", className: "custom-error" }, /* @__PURE__ */ l.createElement(re, { symbol: "info-circle" }), " ", s)))));
}, WT = Liferay.Icons.spritemap, ik = ({ visible: e, onClose: t, onVerify: n, email: r, mobile: a, formData: i }) => {
  const { observer: s, onOpenChange: c } = Br({ onClose: t }), [u, p] = V(""), [g, v] = V(""), [y, E] = V(""), [L, x] = V(""), [C, T] = V(0), [D, k] = V(0), [N, R] = V(0), [A, f] = V(!1), [_, O] = V(0), [J, ee] = V(null), [ge, ie] = V(""), [fe, be] = V(null), [$e, Se] = V(""), [xe, Te] = V(""), [We, Oe] = V(!1), [Ne, Me] = V(""), Ze = _e(null), at = async () => {
    var Ie;
    try {
      const Ue = await Ve.getObjectData("/o/c/globalconfigurations", {}), Xe = (Ie = Ue == null ? void 0 : Ue.items) == null ? void 0 : Ie[0];
      Xe && (console.log("config is ", Xe), be({
        otpExpirationTime: Xe.oTPExpireTime || 180,
        // in seconds
        resendOtpLimit: Xe.resendOTPLimit || 3,
        resendOtpCooldown: Xe.oTPResendDuration || 300,
        // in seconds
        maxInvalidAttempts: Xe.invalidOTPAttemptLimit || 3,
        lockDuration: Xe.oTPResendDuration || 300
        // in seconds
      }));
    } catch (Ue) {
      console.error("Error fetching OTP config", Ue);
    }
  };
  ye(() => {
    e && (at(), p(""), v(""), R(0), f(!1), O(0), ee(null), k(0), ie(""));
  }, [e]), ye(() => {
    !e || !fe || T((Ie) => Ie === 0 ? fe.otpExpirationTime : Ie);
  }, [fe, e]), ye(() => {
    if (C <= 0) return;
    const Ie = setInterval(() => {
      T((Ue) => Ue <= 1 ? (clearInterval(Ie), 0) : Ue - 1);
    }, 1e3);
    return () => clearInterval(Ie);
  }, [C]), ye(() => {
    if (!A || !J) return;
    const Ie = setInterval(() => {
      const Ue = Math.max(Math.floor((J - Date.now()) / 1e3), 0);
      k(Ue), Ue <= 0 && (f(!1), Me('Click\x20here\x20to\x20resend\x20otp\x20activated'), O(0), ee(null), k(0), ie(""));
    }, 1e3);
    return () => clearInterval(Ie);
  }, [A, J]), ye(() => {
    if (!e || C <= 0 || !fe) return;
    [30, 20, 10].includes(C) && Me(nt(He(C)));
  }, [C, e, fe]);
  const He = (Ie) => {
    const Ue = String(Math.floor(Ie / 60)).padStart(2, "0"), Xe = String(Ie % 60).padStart(2, "0");
    return `${Ue}:${Xe}`;
  }, nt = (Ie) => {
    const [Ue, Xe] = Ie.split(":"), ae = parseInt(Ue, 10), oe = parseInt(Xe, 10), we = ae > 0 ? `${ae} ${ae === 1 ? "minute" : "minutes"}` : "", De = oe > 0 ? `${oe} ${oe === 1 ? "second" : "seconds"}` : "";
    return ae > 0 && oe > 0 ? `${we} ${De} ${'Remaining'}` : ae > 0 ? `${we} ${'Remaining'}` : oe > 0 ? `${De} ${'Remaining'}` : 'Time\x20expired';
  };
  ye(() => {
    if (e && C === 0 && !A) {
      Me('activated');
      const Ie = document.querySelector(".resend-otp-button");
      Ie && setTimeout(() => {
        Ie.focus();
      }, 500);
    }
  }, [C, A, e]);
  const yt = () => {
    const Ie = _ + 1;
    if (O(Ie), Ie > fe.maxInvalidAttempts) {
      f(!0), ie("invalid");
      const Ue = Date.now() + fe.lockDuration * 1e3;
      ee(Ue), k(fe.lockDuration), T(0);
    }
  }, Ct = async () => {
    var ae, oe;
    E(""), x(""), Te(""), Se(""), Oe(!0);
    const Ie = !r || u.length === 6, Ue = !a || g.length === 6;
    if (E(r && !Ie ? 'Invalid\x20OTP\x2c\x20please\x20retry' : ""), x(a && !Ue ? 'Invalid\x20OTP\x2c\x20please\x20retry' : ""), !Ie || !Ue) {
      yt();
      return;
    }
    const Xe = {
      mobileNumber: a || "",
      emailAddress: r || "",
      otpType: r && a ? "both" : r ? "email" : "mobile",
      otpAuthId: i.otpObjectId,
      mobileOtp: g,
      emailOtp: u,
      userName: i.name || ""
    };
    try {
      const we = ((ae = i.homePageURL) == null ? void 0 : ae.replace(/\/$/, "")) || "", De = await fetch(`${we}/etds/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Xe)
      }), ue = De.headers.get("content-type"), ne = ue != null && ue.includes("application/json") ? await De.json() : await De.text();
      if (!De.ok) {
        (Xe.otpType === "mobile" || Xe.otpType === "both") && (ne != null && ne.mobileVerified ? Se('One-Time\x20Password\x20is\x20Correct\x21') : (console.log("expired value is ", ne == null ? void 0 : ne.message.toLowerCase().includes("expired")), ne != null && ne.message.toLowerCase().includes("expired") ? (x('OTP\x20has\x20expired\x2c\x20please\x20retry'), Me('OTP\x20has\x20expired\x2c\x20please\x20retry')) : (x('Invalid\x20OTP\x2c\x20please\x20retry'), Me('Invalid\x20OTP\x2c\x20please\x20retry')))), (Xe.otpType === "email" || Xe.otpType === "both") && (ne != null && ne.emailVerified ? Te('One-Time\x20Password\x20is\x20Correct\x21') : ne != null && ne.message.toLowerCase().includes("expired") ? (E('OTP\x20has\x20expired\x2c\x20please\x20retry'), Me('OTP\x20has\x20expired\x2c\x20please\x20retry')) : (E('Invalid\x20OTP\x2c\x20please\x20retry'), Me('Invalid\x20OTP\x2c\x20please\x20retry'))), yt(), Oe(!1);
        return;
      }
      n({ ...i, emailOtp: u, mobileOtp: g });
    } catch (we) {
      console.error("Network/server error:", we), yt(), console.error('etds-a-network-error-occurred-please-try-again'), Oe(!1);
    } finally {
      (oe = Ze.current) == null || oe.focus();
    }
  }, rt = async () => {
    var Ue;
    if (N >= fe.resendOtpLimit) {
      f(!0), ie("resend");
      const Xe = Date.now() + fe.resendOtpCooldown * 1e3;
      ee(Xe), k(fe.resendOtpCooldown), T(0), R(0);
      return;
    }
    const Ie = {
      mobileNumber: a || "",
      emailAddress: r || "",
      otpType: r && a ? "both" : r ? "email" : "mobile",
      otpAuthId: i.otpObjectId,
      userName: i.name || "",
      languageId: Liferay.ThemeDisplay.getLanguageId()
    };
    try {
      const Xe = ((Ue = i.homePageURL) == null ? void 0 : Ue.replace(/\/$/, "")) || "", ae = await fetch(`${Xe}/etds/otp/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Ie)
      }), oe = ae.headers.get("content-type"), we = oe != null && oe.includes("application/json") ? await ae.json() : await ae.text();
      if (!ae.ok) {
        console.error("OTP resend failed:", we);
        return;
      }
      R((De) => De + 1), T(fe.otpExpirationTime), Me(""), setTimeout(() => {
        Me('OTP\x20has\x20been\x20resent\x20successfully'), document.querySelector(".modal-body input.form-control").focus();
      }, 100);
    } catch (Xe) {
      console.error("Network/server error during OTP resend:", Xe), f(!0), ie("resend");
      const ae = Date.now() + fe.resendOtpCooldown * 1e3;
      ee(ae), k(fe.resendOtpCooldown), T(0);
    }
  }, mt = () => {
    const Ie = (!r || u.length === 6) && (!a || g.length === 6), Ue = C > 0;
    return Ie && Ue && !We && !A;
  }, dt = Liferay.ThemeDisplay.getBCP47LanguageId();
  return !e || !fe ? null : /* @__PURE__ */ l.createElement(hl.Provider, { value: WT }, /* @__PURE__ */ l.createElement(
    hn,
    {
      observer: s,
      size: "sm",
      status: "info",
      className: "modal-dialog-centered modal-wrapper otp-authentication"
    },
    /* @__PURE__ */ l.createElement("div", { "aria-live": "assertive", className: "sr-only" }, 'OTP\x20popup\x20opened', "."),
    /* @__PURE__ */ l.createElement("div", { className: "modal-body" }, /* @__PURE__ */ l.createElement("h2", { className: "modal-heading h4", id: "clay-modal-label-1" }, 'OTP\x20Authentication'), /* @__PURE__ */ l.createElement(
      "button",
      {
        className: "common-modal-close-btn",
        onClick: () => {
          Me('OTP\x20authentication\x20dialog\x20closed'), c(!1), T(0);
        },
        "aria-label": 'Close'
      },
      /* @__PURE__ */ l.createElement(re, { symbol: "etds-close-lg" })
    ), /* @__PURE__ */ l.createElement("hr", null), /* @__PURE__ */ l.createElement("div", { className: "otp-authentication-description" }, 'Please\x20enter\x20the\x20latest\x206\x20digit\x20OTP\x20received\x2e\x20Please\x20do\x20not\x20Close\x20or\x20Refresh\x20or\x20press\x20the\x20\x27Cancel\x27\x20button\x2e'), /* @__PURE__ */ l.createElement("div", { className: "contains_mandatory mb-4 contains_mandatory--text-black" }, /* @__PURE__ */ l.createElement("span", { className: "asterisk" }, "*"), '\x2a\x20Indicates\x20mandatory\x20fields'), r && /* @__PURE__ */ l.createElement(
      Xu,
      {
        label: 'Enter\x20Email\x20OTP',
        value: u,
        onChange: (Ie) => p(Ie.target.value),
        error: y,
        name: "emailOtp",
        required: !0,
        successMessage: xe,
        className: "form-control",
        errorIcon: !0,
        ariaLabel: `${'Enter\x206\x20digit\x20Email\x20OTP'}`,
        maxLength: "6"
      }
    ), a && /* @__PURE__ */ l.createElement(
      Xu,
      {
        label: 'Enter\x20Mobile\x20Number\x20OTP',
        value: g,
        onChange: (Ie) => v(Ie.target.value),
        error: L,
        name: "mobileOtp",
        required: !0,
        successMessage: $e,
        className: "form-control",
        errorIcon: !0,
        ariaLabel: `${'Enter\x206\x20digit\x20Mobile\x20Number\x20OTP'}`,
        maxLength: "6"
      }
    ), /* @__PURE__ */ l.createElement("div", { className: "text-center" }, C > 0 && !A && /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", { className: "otp-expire", "aria-hidden": "true" }, 'OTP\x20will\x20expire\x20in', " ", /* @__PURE__ */ l.createElement("span", { className: "sr-only", "aria-live": "off", "aria-atomic": "true", tabIndex: -1 }, nt(He(C))), /* @__PURE__ */ l.createElement("span", { "aria-hidden": "true" }, He(C)), " ", 'minutes'), /* @__PURE__ */ l.createElement("div", { className: "sr-only" }, 'OTP\x20will\x20expire\x20in', "  ", He(C), "  ", 'minutes')), /* @__PURE__ */ l.createElement(
      ym,
      {
        displayType: "link",
        disabled: C > 0 || A,
        onClick: rt,
        className: "resend-otp-button",
        role: "link"
      },
      A ? dt === "hi-IN" ? `${He(D)} ${'min'} ${'Click\x20here\x20to\x20resend\x20OTP\x20in'}` : `${'Click\x20here\x20to\x20resend\x20OTP\x20in'} ${He(D)} ${'min'}` : C > 0 ? dt === "hi-IN" ? `${He(C)} ${'min'} ${'Click\x20here\x20to\x20resend\x20OTP\x20in'}` : `${'Click\x20here\x20to\x20resend\x20OTP\x20in'} ${He(C)} ${'min'}` : 'Click\x20here\x20to\x20resend\x20OTP'
    ), A && ge && /* @__PURE__ */ l.createElement("p", { className: "text-danger small" }, /* @__PURE__ */ l.createElement(re, { symbol: "etds-error-filled", "aria-label": 'error\x20icon' }), ge === "resend" ? `${'You\x20have\x20reached\x20the\x20maximum\x20resend\x20limit\x2e\x20Please\x20try\x20again\x20after'} ${Math.ceil(fe.resendOtpCooldown / 60)} ${fe.resendOtpCooldown > 60 ? 'minutes' : 'minute'}.` : `${'You\x20have\x20reached\x20the\x20maximum\x20limit\x2e\x20Please\x20try\x20again\x20after'} ${Math.ceil(fe.lockDuration / 60)} ${fe.lockDuration > 60 ? 'minutes' : 'minute'}.`))),
    /* @__PURE__ */ l.createElement(
      "div",
      {
        "aria-live": "polite",
        "aria-atomic": "true",
        className: "sr-only",
        id: "otp-status-message"
      },
      Ne
    ),
    /* @__PURE__ */ l.createElement("div", { className: "otp-modal-footer d-flex justify-content-between modal-footer-section modal-footer-section-mobile" }, /* @__PURE__ */ l.createElement(
      "button",
      {
        type: "button",
        className: "btn btn-secondary",
        onClick: () => {
          T(0), t("cancel");
        }
      },
      'Cancel'
    ), /* @__PURE__ */ l.createElement("button", { type: "button", className: "btn btn-primary", onClick: Ct, disabled: !mt() || A, ref: Ze }, 'Verify'))
  ));
}, ok = Xi((e, t) => {
  const {
    vocName: n,
    bpErc: r,
    structureKey: a,
    setIsOpen: i,
    selectCategory: s,
    isAll: c = !0,
    label: u = 'Group',
    aggName: p = "categories"
  } = e, [g, v] = V([]), [y, E] = V(null), [L, x] = V(null), C = vt(async () => {
    var D, k;
    if (!(!n || !r))
      try {
        const N = { ...a && { structure_key: a } }, R = {
          emptySearch: !0,
          erc: r
        }, A = F.createSearchBody(N, R), f = {
          page: 1,
          pageSize: 1
        }, [_, O] = await Promise.all([
          Ve.getCategoriesByVocabularyName(n),
          Ve.getSearchResults(A, f)
        ]), J = await Ve.getVocabularyByName(n), ee = J == null ? void 0 : J.id;
        if (!ee) return;
        const ie = (((k = (D = O == null ? void 0 : O.aggregations) == null ? void 0 : D[p]) == null ? void 0 : k.buckets) || []).filter((be) => be.key.split("-")[0] == ee).map((be) => be.key.split("-")[1]), fe = _.filter((be) => ie.includes(be.id)).map((be) => ({
          value: be.id,
          label: be.name
        }));
        if (c) {
          const be = {
            value: 0,
            label: 'All'
          };
          fe.unshift(be), x(be), E(be), s && s(be);
        }
        v(fe);
      } catch (N) {
        console.error("Fail to fetch Data for GroupByCategroyDropDown", N);
      }
  }, [n, r, a, p, c, s]);
  ye(() => {
    C();
  }, []);
  const T = (D) => {
    s && s(D), E(D);
  };
  return ud(t, () => ({
    reset: () => {
      L && (E(L), s && s(L));
    }
  })), /* @__PURE__ */ l.createElement(
    Sn,
    {
      options: g,
      handleChange: T,
      setIsOpen: i,
      value: y,
      label: u
    }
  );
}), sk = ({
  handleSortOrder: e,
  handleAlphabetClick: t,
  handleAlphabetReset: n,
  alphabetVocabularyName: r,
  alphabetVocabulary: a,
  alphabaticCategoriesList: i,
  validCategories: s,
  selectedIndexId: c
}) => {
  const [u, p] = V(!1), [g, v] = V("asc"), [y, E] = V([]), L = (D) => {
    p(!0), t(D);
  }, x = () => {
    p(!1), n();
  }, C = () => {
    const D = g == "desc" ? "asc" : "desc";
    v(D), e(D);
  }, T = async () => {
    console.log("Fetching alphabatical Index categories"), console.log(a);
    let D = a == null ? void 0 : a.id;
    if (!D && a) {
      const k = await Ve.getVocabularyByName(a);
      D = k == null ? void 0 : k.id;
    }
    if (!D) {
      console.warn("No Vocabulary ID found for", a);
      return;
    }
    console.log("Data will be fetched for Vocabulary Id: " + a.id), console.log(a);
    try {
      const k = Liferay.ThemeDisplay.getLanguageId().startsWith("en") ? { sort: "name:asc" } : {}, N = await Ve.getCategoryByVocabularyId(a.id, k);
      console.log("Category fetch Response"), console.log(N);
      const R = N.items != null && N.items.length > 0 ? N.items : [];
      console.log("categoris List"), console.log(R), E(R);
    } catch (k) {
      console.error("Error fetching categories:", k);
    }
  };
  return ye(() => {
    console.log("alphabatic selector will be loaded"), !(i != null && i.length) && (a != null && a.id) ? T() : E(i);
  }, []), /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement("div", { className: "sort-wrapper d-flex", role: "region", "aria-label": 'Filters' }, /* @__PURE__ */ l.createElement("div", { className: "sort-section d-flex" }, /* @__PURE__ */ l.createElement("span", { className: "sortBy" }, 'Sort\x20by'), /* @__PURE__ */ l.createElement("span", { className: "type", "aria-live": "polite" }, g === "asc" ? 'A-Z' : 'Z-A'), /* @__PURE__ */ l.createElement(
    "button",
    {
      onClick: C,
      type: "button",
      className: `d-flex flex-column sort-icons ml-1 pt-1 ${u ? "disabled" : ""}`,
      disabled: u,
      "aria-label": `${'Sort\x20by'}: ${g === "asc" ? 'A-Z' : 'Z-A'}`
    },
    /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: "etds-asc-sort",
        className: "asc-sort-icon"
      }
    ),
    /* @__PURE__ */ l.createElement(
      re,
      {
        symbol: "etds-desc-sort",
        className: "desc-sort-icon"
      }
    )
  )), y && /* @__PURE__ */ l.createElement("div", { className: "alphabet-section d-flex" }, /* @__PURE__ */ l.createElement("div", { className: "btn-wrapper d-flex" }, /* @__PURE__ */ l.createElement("div", { className: "alphabetical-index" }, 'Alphabetical\x20Index'), /* @__PURE__ */ l.createElement("span", { className: "vertical-border" }), /* @__PURE__ */ l.createElement("button", { className: "btn-alphabet-reset", onClick: x, "aria-label": `${'Reset'} ${'Alphabetical\x20Index'}` }, 'Reset'), /* @__PURE__ */ l.createElement("span", { class: "vertical-border" })), /* @__PURE__ */ l.createElement("div", { className: "alphabet-btn-wrapper", "aria-label": 'Alphabetical\x20Index' }, Array.isArray(y) && y.length > 0 && /* @__PURE__ */ l.createElement(l.Fragment, null, y.map((D) => /* @__PURE__ */ l.createElement(
    "button",
    {
      key: D.id,
      className: `btn-alphabet ${c === D.id ? "active" : ""}`,
      onClick: () => L(D),
      disabled: !s.includes(D.id),
      "aria-label": `${D.name}, ${c === D.id ? 'Selected' : 'Not\x20Selected'}`
    },
    D.name
  )))))));
}, lk = {
  Service: Ve,
  Util: F,
  InternationalTaxationUtil: nn
};
export {
  _D as APMIntegration,
  RS as AlertBox,
  AD as AlertDismissable,
  sk as AlphabaticalIndexSelector,
  pD as AlphabeticalSortToggle,
  yD as BlankFormColumn,
  ak as CaptchaBox,
  IS as Card,
  kD as CheckboxSelectionSection,
  JD as ContentComparisonViewer,
  BD as ContentViewer,
  Ji as CustomFocusLock,
  QD as DTAAContentComparisonViewer,
  mD as DateRangePicker,
  sr as DocViewSidebarAccordion,
  rc as DocViewerFootnoteSection,
  Do as DocViewerPrintSection,
  ko as DocViewerSidebarActionWrapper,
  To as DocViewerSidebarTopElement,
  ID as DocumentUploadWithPreview,
  Ip as DownloadPDFButton,
  lk as ETDS,
  VD as ETDSConfigProvider,
  CD as EmailInput,
  Ap as EmailViewer,
  tk as ErrorBoundary,
  nk as ErrorFallback,
  ND as ExternalLinkCard,
  rk as FeaturedYear,
  kS as FilteredContent,
  TS as FormButton,
  DS as FormButtonGroup,
  iD as FormInput,
  SS as FormInputGroup,
  oD as FormInputText,
  RD as FormTextArea,
  GD as GlobalDataProvider,
  ok as GroupByCategroyDropDown,
  nn as InternationalTaxationUtil,
  MD as LanguageTypeToggle,
  aD as LastUpdatedDate,
  $S as LoadTime,
  nc as Loader,
  uD as MainContent,
  cD as MainWrapper,
  SD as MobileWithCountryCode,
  OS as NewTag,
  gD as NoDues,
  dD as NoResult,
  ik as OtpModal,
  vD as PageLinkCard,
  hD as PageLinkCardsWrapper,
  UD as PaginationBar,
  ZD as ParallelViewer,
  OD as PasswordSetup,
  FD as Prompters,
  Is as RadioButton,
  NS as RadioButtonWrapper,
  Sn as ReactDropdown,
  ek as RedirectionAlertModal,
  HD as RelatedAssetsViewer,
  jD as RelatedContents,
  XD as ScrollerDropdown,
  bD as SearchCompareTab,
  KD as SearchResultItemCard,
  sD as SearchWrapper,
  $D as SelectEntityForComparisonBox,
  zD as SocialMediaShareModal,
  DD as SuccessMessageCard,
  lD as Tabs,
  Ci as TaxCalendarUtil,
  YD as TenderDownloadModal,
  TD as TermsAndConditions,
  Xu as TextInputWithToggle,
  PD as TextareaWithCount,
  tc as TooltipComponent,
  WD as VideoCard,
  qD as VideoModal,
  fD as ViewTypeToggle,
  MS as getETDSConfigContext,
  ED as handleSlickSliderDotsClick,
  wD as handleSlickSliderNextClick,
  LD as handleSlickSliderPlayPauseClick,
  xD as handleSlickSliderPreviousClick
};
