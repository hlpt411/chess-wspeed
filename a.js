/* ============================================================================
 * ChessHv3 — chess.com auto-move fallback (appended to a.js, runs in PAGE world)
 * ----------------------------------------------------------------------------
 * Why this exists:
 *   The original chess.com auto-move path calls chess.com's internal JS API
 *   (window.game / .board.game + getLegalMoves() + game.move()). When chess.com
 *   changes that internal API, the call fails SILENTLY (caught + return false),
 *   so the engine + arrows keep working but the move is never played.
 *
 * What this does (only on *.chess.com, only for {type:'MOVE',from,to}):
 *   1. Lets the ORIGINAL handler run first (it fires after `moveDelay` ms).
 *   2. ~900 ms later, re-reads the board:
 *        - game/API gone          -> SKIP + console warn (never blind-click)
 *        - FEN already changed    -> original move worked, do nothing
 *        - not our turn / gameover-> do nothing
 *   3. Retries the move with a BROADENED game discovery + tolerant matching
 *      (object {from,to} OR uci-string legal-move formats, several move() shapes).
 *   4. If the API still fails, plays the move with real DOM clicks on
 *      <wc-chess-board> square centers (click-click, like a human), with
 *      orientation detection (flipped attr -> coordinate labels -> own color).
 *   5. Special cases: castling retry via rook square, promotion picker
 *      best-effort auto-queen, post-click FEN verification + console report.
 *
 * Safety: NEVER clicks when the board cannot be read (no FEN) or when it is
 * not our turn. All failures are reported to the page console with [AutoMove].
 * ========================================================================== */
;(function () {
"use strict";

var HOST_OK = false;
try {
  HOST_OK = typeof location !== "undefined" && /(^|\.)chess\.com$/.test(location.hostname || "");
} catch (e) { HOST_OK = false; }
if (!HOST_OK) return;
try {
  if (window.__chesshv3_automove_fb) return;
  window.__chesshv3_automove_fb = true;
} catch (e) { return; }

function log()   { try { console.info.apply(console, ["[AutoMove]"].concat([].slice.call(arguments))); } catch (e) {} }
function warn()  { try { console.warn.apply(console, ["[AutoMove]"].concat([].slice.call(arguments))); } catch (e) {} }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ---------------- 1. game discovery (broadened) ---------------- */
function looksLikeGame(g) {
  try {
    return !!g && typeof g.getFEN === "function" &&
      (typeof g.getLegalMoves === "function" || typeof g.move === "function");
  } catch (e) { return false; }
}
function findGame() {
  try {
    try { if (looksLikeGame(window.game)) return window.game; } catch (e) {}
    var b = null;
    try { b = document.querySelector(".board"); } catch (e) {}
    if (b) { try { if (looksLikeGame(b.game)) return b.game; } catch (e) {} }
    var wc = null;
    try { wc = document.querySelector("wc-chess-board"); } catch (e) {}
    if (wc) {
      var props = ["game", "_game", "chess", "board", "controller",
                   "gameController", "view", "model", "state", "app"];
      for (var i = 0; i < props.length; i++) {
        try { if (looksLikeGame(wc[props[i]])) return wc[props[i]]; } catch (e) {}
      }
      try { // bounded generic scan of element props (cheap, guarded)
        var keys = Object.keys(wc);
        for (var k = 0; k < keys.length && k < 60; k++) {
          try {
            var v = wc[keys[k]];
            if (v && typeof v === "object" && looksLikeGame(v)) return v;
          } catch (e) {}
        }
      } catch (e) {}
    }
    var gnames = ["Chess", "chess", "ChessGame", "gameController",
                  "liveGame", "LiveChess", "board"];
    for (var j = 0; j < gnames.length; j++) {
      try { if (looksLikeGame(window[gnames[j]])) return window[gnames[j]]; } catch (e) {}
    }
  } catch (e) {}
  return null;
}
function safeFen(g) {
  try {
    var f = g.getFEN();
    return (typeof f === "string" && f.indexOf(" ") > -1) ? f : null;
  } catch (e) { return null; }
}
function safePlayingAs(g) {
  try {
    if (typeof g.getPlayingAs !== "function") return null;
    var s = String(g.getPlayingAs() == null ? "" : g.getPlayingAs()).toLowerCase();
    return (s === "white" || s === "black") ? s : null;
  } catch (e) { return null; }
}
function turnOfFen(fen) {
  try {
    var t = String(fen).split(" ")[1];
    return t === "w" ? "white" : (t === "b" ? "black" : null);
  } catch (e) { return null; }
}
function isGameOver(g) {
  try { if (typeof g.isGameOver === "function") return !!g.isGameOver(); } catch (e) {}
  return false;
}

/* ---------------- 2. improved API move attempt ---------------- */
function asArray(moves) {
  if (!moves) return null;
  if (Array.isArray(moves)) return moves;
  try {
    if (typeof moves.length === "number") return Array.prototype.slice.call(moves);
  } catch (e) {}
  return null;
}
function matchMove(moves, from, to) {
  var list = asArray(moves);
  if (!list) return undefined;
  var uci = from + to;
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (m == null) continue;
    try {
      if (typeof m === "string") { if (m.indexOf(uci) === 0) return m; continue; }
      if (m.from === from && m.to === to) return m;
      if (typeof m.uci === "string" && m.uci.indexOf(uci) === 0) return m;
    } catch (e) {}
  }
  return undefined;
}
function tryApiMove(g, from, to) {
  var moves = null;
  try { moves = g.getLegalMoves(); } catch (e) { return false; }
  var m = matchMove(moves, from, to);
  if (m === undefined || m === null) return false;
  var attempts = [
    function () { return g.move(m); },
    function () { return g.move({ from: from, to: to }); },
    function () { return g.move(from, to); }
  ];
  for (var i = 0; i < attempts.length; i++) {
    try { attempts[i](); return true; } catch (e) { /* try next shape */ }
  }
  return false;
}

/* ---------------- 3. DOM click fallback ---------------- */
function boardEl() {
  try {
    return document.querySelector("wc-chess-board") || document.querySelector(".board");
  } catch (e) { return null; }
}
function detectFlipped(b, myColor) {
  // 3a. explicit flipped flag on the board element
  try {
    if (b) {
      if (b.hasAttribute && b.hasAttribute("flipped")) {
        var v = String(b.getAttribute("flipped") || "").toLowerCase();
        if (v === "" || v === "true" || v === "1") return true;
        if (v === "false" || v === "0") return false;
      }
      if (typeof b.flipped === "boolean") return b.flipped;
    }
  } catch (e) {}
  // 3b. coordinate labels (a..h): order along the bottom row reveals orientation
  try {
    var scopes = [];
    if (b && b.parentNode) scopes.push(b.parentNode);
    try { scopes.push(document); } catch (e) {}
    if (b && b.shadowRoot) scopes.push(b.shadowRoot);
    var pts = [];
    for (var s = 0; s < scopes.length; s++) {
      var all = null;
      try { all = scopes[s].querySelectorAll("*"); } catch (e) { continue; }
      if (!all) continue;
      for (var i = 0; i < all.length && pts.length < 64; i++) {
        var el = all[i];
        try {
          if (el.children && el.children.length) continue;
          var t = (el.textContent || "").trim();
          if (t.length !== 1 || t < "a" || t > "h") continue;
          var r = el.getBoundingClientRect();
          if (!(r.width > 0 && r.height > 0)) continue;
          pts.push({ ch: t, x: r.left + r.width / 2, y: r.top + r.height / 2 });
        } catch (e) {}
      }
      if (pts.length >= 4) break;
    }
    if (pts.length >= 4) {
      pts.sort(function (p, q) { return p.y - q.y; });
      var best = [], cur = [pts[0]];
      for (var j = 1; j < pts.length; j++) {
        if (Math.abs(pts[j].y - cur[cur.length - 1].y) <= 14) cur.push(pts[j]);
        else { if (cur.length > best.length) best = cur; cur = [pts[j]]; }
      }
      if (cur.length > best.length) best = cur;
      if (best.length >= 4) {
        best.sort(function (p, q) { return p.x - q.x; });
        var first = best[0].ch, last = best[best.length - 1].ch;
        if (first === "a" && last === "h") return false; // a left -> white bottom
        if (first === "h" && last === "a") return true;  // h left -> black bottom
      }
    }
  } catch (e) {}
  // 3c. default: chess.com puts your own color at the bottom
  return myColor === "black";
}
function squareCenter(b, sq, flipped) {
  var r = b.getBoundingClientRect();
  var f = sq.charCodeAt(0) - 97, rank = sq.charCodeAt(1) - 49; // 0..7
  var col = flipped ? 7 - f : f;
  var row = flipped ? rank : 7 - rank; // row 0 = top
  return { x: r.left + (col + 0.5) * r.width / 8,
           y: r.top + (row + 0.5) * r.height / 8 };
}
function dispatchClick(target, x, y) {
  var t = target || null;
  try { if (!t) t = document.querySelector("wc-chess-board"); } catch (e) {}
  if (!t) return;
  function one(Ctor, type, extra) {
    var o = { bubbles: true, cancelable: true, composed: true, view: window,
              clientX: x, clientY: y, screenX: x, screenY: y, button: 0 };
    if (extra) for (var k in extra) o[k] = extra[k];
    try {
      t.dispatchEvent(new Ctor(type, o));
    } catch (err) {
      try { // legacy fallback
        var e2 = document.createEvent("MouseEvents");
        e2.initMouseEvent(type, true, true, window, 1, x, y, x, y,
                          false, false, false, false, 0, null);
        t.dispatchEvent(e2);
      } catch (e3) {}
    }
  }
  var hasPE = false;
  try { hasPE = typeof window.PointerEvent === "function" || typeof PointerEvent === "function"; } catch (e) {}
  var PE = null;
  try { PE = window.PointerEvent || PointerEvent; } catch (e) {}
  var ME = null;
  try { ME = window.MouseEvent || MouseEvent; } catch (e) {}
  try {
    if (hasPE && PE) {
      one(PE, "pointerover", { pointerId: 1, pointerType: "mouse", isPrimary: true });
      one(PE, "pointerenter", { pointerId: 1, pointerType: "mouse", isPrimary: true });
    }
  } catch (e) {}
  try { if (ME) one(ME, "mouseover", {}); } catch (e) {}
  try { if (hasPE && PE) one(PE, "pointerdown", { pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 1 }); } catch (e) {}
  try { if (ME) one(ME, "mousedown", { buttons: 1 }); } catch (e) {}
  try { if (hasPE && PE) one(PE, "pointerup", { pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 0 }); } catch (e) {}
  try { if (ME) { one(ME, "mouseup", { buttons: 0 }); one(ME, "click", {}); } } catch (e) {}
}
function pointTarget(x, y, fallbackEl) {
  try {
    var el = document.elementFromPoint(x, y);
    return el || fallbackEl;
  } catch (e) { return fallbackEl; }
}
function pieceAtFen(fen, sq) {
  try {
    var rows = String(fen).split(" ")[0].split("/");
    var f = sq.charCodeAt(0) - 97, r = 8 - parseInt(sq.charAt(1), 10);
    var row = rows[r] || "", x = -1;
    for (var i = 0; i < row.length; i++) {
      var c = row.charAt(i);
      if (c >= "1" && c <= "8") x += +c;
      else { x++; if (x === f) return c; }
    }
  } catch (e) {}
  return "";
}
function isPromotionMove(fen, from, to) {
  try {
    var p = pieceAtFen(fen, from), tr = parseInt(to.charAt(1), 10);
    return (p === "P" && tr === 8) || (p === "p" && tr === 1);
  } catch (e) { return false; }
}
function isKingsideCastle(fen, from, to) {
  try {
    var p = pieceAtFen(fen, from);
    if (p !== "K" && p !== "k") return null;
    var df = to.charCodeAt(0) - from.charCodeAt(0);
    if (Math.abs(df) !== 2) return null;
    return { rank: from.charAt(1), rookFile: df > 0 ? "h" : "a" };
  } catch (e) { return null; }
}
function clickSquare(b, sq, flipped) {
  var p = squareCenter(b, sq, flipped);
  dispatchClick(pointTarget(p.x, p.y, b), p.x, p.y);
}
async function domMove(from, to, fenNow, needPromo) {
  var b = boardEl();
  if (!b) { warn("board element not found, cannot click"); return false; }
  var g = findGame();
  var me = g ? safePlayingAs(g) : null;
  var flipped = detectFlipped(b, me);
  // final freshness check right before clicking (kills races)
  try {
    if (g) {
      var f = safeFen(g);
      if (!f || f !== fenNow) { log("position changed, click aborted"); return false; }
      if (isGameOver(g)) return false;
      var turn = turnOfFen(f);
      if (me && turn && turn !== me) return false;
    }
  } catch (e) {}
  clickSquare(b, from, flipped);
  await sleep(140);
  clickSquare(b, to, flipped);
  await sleep(450);
  // verify the move landed
  var landed = false;
  try {
    var g2 = findGame();
    var f2 = g2 ? safeFen(g2) : null;
    landed = !!(f2 && f2 !== fenNow);
  } catch (e) {}
  if (!landed) {
    // castling via click-click sometimes wants king->ROOK: retry once
    var castle = isKingsideCastle(fenNow, from, to);
    if (castle) {
      var rookSq = castle.rookFile + castle.rank;
      log("retrying castling via rook square " + rookSq);
      clickSquare(b, from, flipped);
      await sleep(140);
      clickSquare(b, rookSq, flipped);
      await sleep(450);
      try {
        var g3 = findGame();
        var f3 = g3 ? safeFen(g3) : null;
        landed = !!(f3 && f3 !== fenNow);
      } catch (e) {}
    }
  }
  if (landed) {
    log("played via board clicks: " + from + to);
    if (needPromo) setTimeout(handlePromotionPicker, 350);
  } else {
    warn("clicks did not register (" + from + to +
         ") — board layout may have changed; move NOT played");
  }
  return landed;
}
function handlePromotionPicker() {
  var sels = [".promotion-piece.q", ".promotion-piece.queen",
              ".promotion-window .q", ".promotion-option.q",
              "[class*='promotion'][class*='q']"];
  for (var i = 0; i < sels.length; i++) {
    try {
      var el = document.querySelector(sels[i]);
      if (el) {
        if (el.click) el.click();
        else dispatchClick(el, 0, 0);
        log("promotion: auto-queen");
        return;
      }
    } catch (e) {}
  }
  log("promotion: please pick a piece (or enable auto-queen in chess.com settings)");
}

/* ---------------- 4. main listener ---------------- */
window.addEventListener("message", function (ev) {
  try {
    var d = ev.data || {};
    if (!d || d.type !== "MOVE") return;
    if (typeof d.from !== "string" || typeof d.to !== "string") return;
    var from = d.from, to = d.to;
    var baseDelay = (+d.moveDelay) || 0;
    var g0 = findGame();
    var fenBefore = g0 ? safeFen(g0) : null;
    setTimeout(function () {
      (async function () {
        try {
          var g = findGame();
          if (!g) {
            warn("chess.com board API not found — cannot verify position, move skipped (" +
                 from + to + ")");
            return;
          }
          if (isGameOver(g)) return;
          var fenNow = safeFen(g);
          if (!fenNow) {
            warn("cannot read board FEN — move skipped (" + from + to + ")");
            return;
          }
          if (fenBefore && fenNow !== fenBefore) return; // original move worked
          var me = safePlayingAs(g);
          var turn = turnOfFen(fenNow);
          if (!me || !turn || turn !== me) return; // not our turn
          // 1) retry with the improved API path
          var apiOk = false;
          try { apiOk = tryApiMove(g, from, to); } catch (e) { apiOk = false; }
          if (apiOk) {
            await sleep(400);
            var fenAfter = safeFen(g);
            if (fenAfter && fenAfter !== fenNow) {
              log("played via API: " + from + to);
              return;
            }
          }
          // 2) DOM click fallback
          log("API move failed, using board clicks: " + from + to);
          var needPromo = isPromotionMove(fenNow, from, to);
          await domMove(from, to, fenNow, needPromo);
        } catch (err) { warn("fallback error:", err); }
      })();
    }, baseDelay + 900);
  } catch (e) {}
});

log("chess.com fallback ready");
})();
