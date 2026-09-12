/* ============================================================
   ChessHv3 v10 — Control Center logic
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  try { chrome?.runtime?.sendMessage({ type: "popupReady" }); } catch (e) {}
});

var bookSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="" width="24" height="24" viewBox="0 0 18 19">
      <g id="book">
    <path class="icon-shadow" opacity="0.3" d="M9,.5a9,9,0,1,0,9,9A9,9,0,0,0,9,.5Z"></path>
    <path class="icon-background" fill="#D5A47D" d="M9,0a9,9,0,1,0,9,9A9,9,0,0,0,9,0Z"></path>
    <g>
      <path class="icon-component-shadow" opacity="0.3" isolation="isolate" d="M8.45,5.9c-1-.75-2.51-1.09-4.83-1.09H2.54v8.71H3.62a8.16,8.16,0,0,1,4.83,1.17Z"></path>
      <path class="icon-component-shadow" opacity="0.3" isolation="isolate" d="M9.54,14.69a8.14,8.14,0,0,1,4.84-1.17h1.08V4.81H14.38c-2.31,0-3.81.34-4.84,1.09Z"></path>
      <path class="icon-component" fill="#fff" d="M8.45,5.4c-1-.75-2.51-1.09-4.83-1.09H3V13h.58a8.09,8.09,0,0,1,4.83,1.17Z"></path>
      <path class="icon-component" fill="#fff" d="M9.54,14.19A8.14,8.14,0,0,1,14.38,13H15V4.31h-.58c-2.31,0-3.81.34-4.84,1.09Z"></path>
    </g>
  </g>
    </svg>`;

const el = (id) => document.getElementById(id);

/* ================= I18N (EN / VI) ================= */
const I18N = {
  en: {
    subtitle: "Engine Control Center",
    tabSettings: "Settings", tabStream: "Stream", tabLoad: "Load", tabExport: "Export",
    chipEngine: "Engine", chipDepth: "Depth", chipArrows: "Arrows",
    gEngine: "Engine & Strength", gEngineSub: "Brain of your assistant",
    gArrows: "Arrows & Display", gArrowsSub: "How hints appear on board",
    gAuto: "Automation", gAutoSub: "Let the engine play for you",
    gAnalysis: "Analysis & Safety", gAnalysisSub: "Stats, accuracy & smart filters",
    engine: "Engine", engineHelp: "Choose which chess engine to run for analysis and gameplay.",
    eloTip: "Recommended: <b>max ELO</b> with accuracy display ON.",
    style: "Style", styleHelp: "Preferred playstyle of the engine.",
    depth: "Depth", depthHelp: "Search depth — higher is stronger but slower.",
    depthTip: "Slow device? Use depth <b>4–6</b>.",
    arrows: "Arrows", arrowsHelp: "Number of best-move arrows on the board.",
    arrowColors: "Arrow colors", arrowColorsHelp: "Customize colors for the top 5 engine moves.",
    presets: "Presets:",
    showEvalHelp: "Displays the engine evaluation bar.",
    hideArrowsHelp: "Hides move suggestions, keeps eval only.",
    autoMoveHelp: "Automatically plays the best move for you.",
    balancedHelp: "Avoids always playing the best move — more human.",
    autoStartHelp: "Auto-starts a new game after the current one ends.",
    delay: "Auto Move Delay", delayHelp: "Actual delay is random between 0 and this value.",
    playKey: "Play Best Move (Key)", playKeyHelp: "Press to instantly play the engine's best move.",
    reviewHelp: "Stats for all games + analyze your last 10 games.",
    statHelp: "Real-time game accuracy and estimated Elo.",
    winningHelp: "Only shows moves keeping a strong advantage (+2).",
    winningTip: "Play solo until your opponent <b>blunders</b>.",
    accSafe: "Safe", accWarn: "Warning", accSusp: "Suspicious", accBad: "Cheat detected",
    eloHelp: "Engine strength. Higher = stronger play.",
    reset: "Reset to defaults",
    liveBoard: "Live Board", liveBoardSub: "Mirrored from your active game",
    evaluation: "Evaluation", topMoves: "Top moves", topMovesSub: "Engine suggestions",
    waiting: "Waiting for game data…",
    loadTitle: "Load Settings", loadSub: "Paste a previously exported JSON config below.",
    loadBtn: "Load Config",
    exportTitle: "Export Settings", exportSub: "Generate your current config as JSON.",
    exportBtn: "Export Config", copyBtn: "Copy",
    footer: "Made for chess lovers — play smart, play fair.",
    whiteMove: "White to move", blackMove: "Black to move",
    statusReady: "Ready", statusLive: "Live",
    tLoaded: "Config loaded successfully!", tInvalid: "Invalid JSON. Please check your config.",
    tEmpty: "Paste a JSON config first.", tExported: "Config exported!", tCopied: "Copied to clipboard!",
    tReset: "Settings reset to defaults", tPreset: "Color preset applied",
    lbAutoMove: "Auto Move", lbBalanced: "Balanced Auto Move", lbAutoStart: "Auto Start Game",
    lbReview: "ChessHv3 Check", lbStat: "Display accuracy and Elo estimation",
    lbWinning: "Only Moves That Gain Material", lbShowEval: "Show Eval Bar", lbHideArrows: "Hide Arrows",
  },
  vi: {
    subtitle: "Trung tâm điều khiển Engine",
    tabSettings: "Cài đặt", tabStream: "Trực tiếp", tabLoad: "Nạp", tabExport: "Xuất",
    chipEngine: "Engine", chipDepth: "Độ sâu", chipArrows: "Mũi tên",
    gEngine: "Engine & Sức mạnh", gEngineSub: "Bộ não của trợ thủ",
    gArrows: "Mũi tên & Hiển thị", gArrowsSub: "Cách gợi ý hiện trên bàn cờ",
    gAuto: "Tự động", gAutoSub: "Để engine tự đánh thay bạn",
    gAnalysis: "Phân tích & An toàn", gAnalysisSub: "Thống kê, độ chính xác & bộ lọc thông minh",
    engine: "Engine", engineHelp: "Chọn engine cờ vua để phân tích và thi đấu.",
    eloTip: "Khuyên dùng: <b>ELO tối đa</b> + bật hiển thị độ chính xác.",
    style: "Phong cách", styleHelp: "Lối chơi ưa thích của engine.",
    depth: "Độ sâu", depthHelp: "Độ sâu tìm kiếm — càng cao càng mạnh nhưng càng chậm.",
    depthTip: "Máy yếu? Dùng độ sâu <b>4–6</b>.",
    arrows: "Mũi tên", arrowsHelp: "Số mũi tên nước đi tốt nhất hiển thị trên bàn.",
    arrowColors: "Màu mũi tên", arrowColorsHelp: "Tùy chỉnh màu cho 5 nước đi tốt nhất.",
    presets: "Mẫu có sẵn:",
    showEvalHelp: "Hiển thị thanh đánh giá của engine.",
    hideArrowsHelp: "Ẩn gợi ý nước đi, chỉ giữ thanh eval.",
    autoMoveHelp: "Tự động đánh nước đi tốt nhất cho bạn.",
    balancedHelp: "Không luôn đánh nước tốt nhất — giống con người hơn.",
    autoStartHelp: "Tự động bắt đầu ván mới sau khi ván hiện tại kết thúc.",
    delay: "Độ trễ tự đánh", delayHelp: "Độ trễ thực tế ngẫu nhiên từ 0 đến giá trị này.",
    playKey: "Đánh nước tốt nhất (Phím)", playKeyHelp: "Nhấn để đánh ngay nước tốt nhất của engine.",
    reviewHelp: "Thống kê mọi ván đấu + phân tích 10 ván gần nhất.",
    statHelp: "Độ chính xác và Elo ước tính theo thời gian thực.",
    winningHelp: "Chỉ hiện nước đi giữ lợi thế lớn (+2).",
    winningTip: "Tự chơi cho đến khi đối thủ <b>sai lầm</b>.",
    accSafe: "An toàn", accWarn: "Cảnh báo", accSusp: "Đáng ngờ", accBad: "Phát hiện gian lận",
    eloHelp: "Sức mạnh engine. Càng cao đánh càng mạnh.",
    reset: "Khôi phục mặc định",
    liveBoard: "Bàn cờ trực tiếp", liveBoardSub: "Phản chiếu từ ván đang chơi",
    evaluation: "Đánh giá", topMoves: "Nước đi tốt", topMovesSub: "Gợi ý từ engine",
    waiting: "Đang chờ dữ liệu ván đấu…",
    loadTitle: "Nạp cài đặt", loadSub: "Dán cấu hình JSON đã xuất trước đó vào bên dưới.",
    loadBtn: "Nạp cấu hình",
    exportTitle: "Xuất cài đặt", exportSub: "Tạo cấu hình hiện tại dưới dạng JSON.",
    exportBtn: "Xuất cấu hình", copyBtn: "Sao chép",
    footer: "Dành cho người yêu cờ — chơi thông minh, chơi đẹp.",
    whiteMove: "Trắng đi", blackMove: "Đen đi",
    statusReady: "Sẵn sàng", statusLive: "Đang live",
    tLoaded: "Nạp cấu hình thành công!", tInvalid: "JSON không hợp lệ. Kiểm tra lại cấu hình.",
    tEmpty: "Hãy dán cấu hình JSON trước.", tExported: "Đã xuất cấu hình!", tCopied: "Đã sao chép!",
    tReset: "Đã khôi phục cài đặt mặc định", tPreset: "Đã áp dụng mẫu màu",
    lbAutoMove: "Tự động đánh", lbBalanced: "Tự đánh cân bằng", lbAutoStart: "Tự bắt đầu ván mới",
    lbReview: "Kiểm tra ChessHv3", lbStat: "Hiện độ chính xác & Elo ước tính",
    lbWinning: "Chỉ nước đi hơn quân", lbShowEval: "Hiện thanh Eval", lbHideArrows: "Ẩn mũi tên",
  },
};
let uiLang = "en";
const t = (k) => (I18N[uiLang] && I18N[uiLang][k]) || I18N.en[k] || k;

function applyLang() {
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
  document.documentElement.lang = uiLang;
  el("langLabel").textContent = uiLang === "en" ? "VI" : "EN";
  updateToggleLabels();
  refreshStatus();
}

/* ================= THEME ================= */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { chrome.storage.local.set({ uiTheme: theme }); } catch (e) {}
}

/* ================= TOASTS ================= */
function toast(msg, type = "success") {
  const box = el("toasts");
  if (!box) return;
  const d = document.createElement("div");
  d.className = "toast " + type;
  d.innerHTML = `<span class="t-ico">${type === "success" ? "✓" : "⚠"}</span><span></span>`;
  d.lastChild.textContent = msg;
  box.appendChild(d);
  setTimeout(() => { d.classList.add("out"); setTimeout(() => d.remove(), 320); }, 2600);
}

/* ================= TABS + INDICATOR ================= */
function moveIndicator() {
  const active = document.querySelector(".tab.active");
  const ind = el("tabIndicator");
  if (!active || !ind) return;
  ind.style.left = active.offsetLeft + "px";
  ind.style.width = active.offsetWidth + "px";
}
document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab, .panel, #stream").forEach((e) => e.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.panel).classList.add("active");
    moveIndicator();
    // Board is initialised while hidden (width 0) → re-size when Stream opens
    if (tab.dataset.panel === "stream" && board) {
      setTimeout(() => { try { board.resize(); } catch (e) {} }, 60);
    }
  };
});
window.addEventListener("resize", () => {
  moveIndicator();
  if (document.getElementById("stream").classList.contains("active") && board) {
    try { board.resize(); } catch (e) {}
  }
});
setTimeout(moveIndicator, 60);

/* ================= CHESS CONFIG ================= */
const defaultChessConfig = {
  engine: "komodo",
  review: false,
  elo: 3500,
  lines: 5,
  colors: ["#4f8cff", "#2ecc71", "#f1c40f", "#e67e22", "#e74c3c"],
  depth: 10,
  delay: 100,
  style: "Default",
  autoMove: false,
  autoMoveBalanced: false,
  stat: false,
  autoStart: false,
  winningMove: false,
  showEval: false,
  onlyShowEval: false,
  key: " ",
};

var chessConfig = { ...defaultChessConfig };

function loadChessConfig(callback) {
  try {
    chrome.storage.local.get(["chessConfig", "uiTheme", "uiLang"], function (result) {
      const savedConfig = result.chessConfig;
      chessConfig = savedConfig ? { ...defaultChessConfig, ...savedConfig } : { ...defaultChessConfig };
      if (result.uiTheme) document.documentElement.dataset.theme = result.uiTheme;
      if (result.uiLang && I18N[result.uiLang]) uiLang = result.uiLang;
      applyLang();
      updateChessUI();
      if (callback) callback();
    });
  } catch (e) {
    updateChessUI();
    if (callback) callback();
  }
}

function saveChessConfig() {
  try { chrome.storage.local.set({ chessConfig }, function () {}); } catch (e) {}
}

const COLOR_IDS = ["colorBest", "color2", "color3", "color4", "color5"];

function hideExtraColorInputs(lines) {
  COLOR_IDS.forEach((id, index) => {
    const input = el(id);
    if (input && input.parentElement) {
      input.parentElement.style.display = index >= lines ? "none" : "";
    }
  });
}

function paintRange(input) {
  if (!input || input.type !== "range") return;
  const min = +input.min || 0, max = +input.max || 100;
  const pct = ((+input.value - min) / (max - min)) * 100;
  input.style.setProperty("--fill", pct + "%");
}
function paintAllRanges() {
  ["elo", "lines", "depth", "delay"].forEach((k) => paintRange(el(k)));
}

function updateToggleLabels() {
  const pairs = [
    ["autoMoveLabel", "lbAutoMove", "autoMove"],
    ["autoMoveBalancedLabel", "lbBalanced", "autoMoveBalanced"],
    ["autoStartLabel", "lbAutoStart", "autoStart"],
    ["reviewLabel", "lbReview", "review"],
    ["statLabel", "lbStat", "stat"],
    ["winningMoveLabel", "lbWinning", "winningMove"],
    ["showEvalLabel", "lbShowEval", "showEval"],
    ["onlyShowEvalLabel", "lbHideArrows", "onlyShowEval"],
  ];
  pairs.forEach(([labelId, langKey, cfgKey]) => {
    const n = el(labelId);
    if (n) n.textContent = `${t(langKey)} (${chessConfig[cfgKey] ? "ON" : "OFF"})`;
  });
}

const ENGINE_SHORT = { komodo: "Komodo 3.3", stockfish: "Stockfish 18", torch: "Torch" };

function refreshChips() {
  if (el("chipEngine")) el("chipEngine").textContent = ENGINE_SHORT[chessConfig.engine] || chessConfig.engine;
  if (el("chipElo")) el("chipElo").textContent = chessConfig.elo;
  if (el("chipDepth")) el("chipDepth").textContent = chessConfig.depth;
  if (el("chipArrows")) el("chipArrows").textContent = chessConfig.lines;
  const auto = el("chipAuto");
  if (auto) {
    auto.textContent = chessConfig.autoMove ? "ON" : "OFF";
    auto.className = "chip-v " + (chessConfig.autoMove ? "on" : "off");
  }
}

let isLive = false;
function refreshStatus() {
  const s = el("statusText");
  if (s) s.textContent = isLive ? t("statusLive") : t("statusReady");
  const pill = el("statusPill");
  if (pill) pill.classList.toggle("live", isLive);
}

function updateChessUI() {
  ["elo", "lines", "depth", "delay"].forEach((k) => { if (el(k)) el(k).value = chessConfig[k]; });
  if (el("style")) el("style").value = chessConfig.style;
  if (el("key")) el("key").value = chessConfig.key;
  if (el("engine")) el("engine").value = chessConfig.engine;

  ["autoMove", "stat", "winningMove", "autoStart", "review", "showEval", "onlyShowEval", "autoMoveBalanced"]
    .forEach((k) => { if (el(k)) el(k).checked = !!chessConfig[k]; });

  COLOR_IDS.forEach((id, i) => { if (el(id) && chessConfig.colors[i]) el(id).value = chessConfig.colors[i]; });

  if (el("eloValue")) el("eloValue").textContent = chessConfig.elo;
  if (el("linesValue")) el("linesValue").textContent = chessConfig.lines;
  if (el("depthValue")) el("depthValue").textContent = chessConfig.depth;
  if (el("delayValue")) el("delayValue").textContent = chessConfig.delay;

  updateToggleLabels();
  refreshChips();
  paintAllRanges();
  hideExtraColorInputs(chessConfig.lines);
}

function saveChess() { saveChessConfig(); }

loadChessConfig(updateChessUI);

/* ================= INPUT HANDLERS ================= */
["elo", "lines", "depth", "delay"].forEach((k) => {
  const input = el(k);
  if (!input) return;
  input.oninput = (e) => {
    chessConfig[k] = +e.target.value;
    updateChessUI();
    saveChess();
  };
});

["autoMove", "stat", "winningMove", "autoStart", "review", "showEval", "onlyShowEval", "autoMoveBalanced"]
  .forEach((k) => {
    const input = el(k);
    if (!input) return;
    input.onchange = (e) => {
      chessConfig[k] = e.target.checked;
      updateChessUI();
      saveChess();
    };
  });

if (el("style")) el("style").onchange = (e) => { chessConfig.style = e.target.value; updateChessUI(); saveChess(); };
if (el("key")) el("key").onchange = (e) => { chessConfig.key = e.target.value; updateChessUI(); saveChess(); };
if (el("engine")) el("engine").onchange = (e) => { chessConfig.engine = e.target.value; updateChessUI(); saveChess(); };

COLOR_IDS.forEach((id, index) => {
  const input = el(id);
  if (!input) return;
  input.addEventListener("input", (e) => {
    chessConfig.colors[index] = e.target.value;
    saveChess();
    refreshChips();
  });
});

/* Color presets */
const PRESETS = [
  ["#4f8cff", "#2ecc71", "#f1c40f", "#e67e22", "#e74c3c"],
  ["#00e5ff", "#76ff03", "#ffea00", "#ff9100", "#ff1744"],
  ["#82b1ff", "#40c4aa", "#ffd96a", "#ff9e64", "#f7768e"],
  ["#ffffff", "#c9d4e0", "#8fa1b5", "#5b6b7d", "#2f3a47"],
];
document.querySelectorAll(".preset").forEach((btn) => {
  btn.onclick = () => {
    const p = PRESETS[+btn.dataset.preset];
    if (!p) return;
    chessConfig.colors = [...p];
    updateChessUI();
    saveChess();
    toast(t("tPreset"));
  };
});

/* Reset */
if (el("resetBtn")) el("resetBtn").onclick = () => {
  chessConfig = { ...defaultChessConfig };
  saveChessConfig();
  updateChessUI();
  toast(t("tReset"));
};

/* Theme + Lang buttons */
if (el("themeBtn")) el("themeBtn").onclick = () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(next);
};
if (el("langBtn")) el("langBtn").onclick = () => {
  uiLang = uiLang === "en" ? "vi" : "en";
  try { chrome.storage.local.set({ uiLang }); } catch (e) {}
  applyLang();
  moveIndicator();
  renderMoveList(lastMoves);
};

/* ================= LOAD SETTINGS TAB ================= */
if (el("loadBtn")) el("loadBtn").onclick = () => {
  const raw = el("loadInput").value.trim();
  const feedback = el("loadFeedback");
  if (!raw) {
    feedback.textContent = "⚠ " + t("tEmpty");
    feedback.className = "load-feedback error";
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    chessConfig = { ...defaultChessConfig, ...parsed };
    saveChessConfig();
    updateChessUI();
    feedback.textContent = "✓ " + t("tLoaded");
    feedback.className = "load-feedback success";
    el("loadInput").value = "";
    toast(t("tLoaded"));
  } catch (e) {
    feedback.textContent = "✗ " + t("tInvalid");
    feedback.className = "load-feedback error";
    toast(t("tInvalid"), "error");
  }
};

/* ================= EXPORT TAB ================= */
if (el("exportBtn")) el("exportBtn").onclick = () => {
  const json = JSON.stringify(chessConfig, null, 2);
  el("exportOutput").textContent = json;
  el("exportOutput").classList.add("show");
  el("copyBtn").classList.add("show");
  toast(t("tExported"));
};

if (el("copyBtn")) el("copyBtn").onclick = () => {
  const text = el("exportOutput").textContent;
  const done = () => {
    toast(t("tCopied"));
    const btn = el("copyBtn");
    const label = btn.querySelector("span");
    if (label) {
      const original = label.textContent;
      label.textContent = "✓";
      setTimeout(() => (label.textContent = original), 1500);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
};
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done(); } catch (e) { toast(t("tInvalid"), "error"); }
  ta.remove();
}

/* ================= STREAM BOARD ================= */
let boardConfig = { position: "start" };
var board = null;
try { board = Chessboard("board1", boardConfig); } catch (e) {}

var updateEval = (scoreStr, color = "white") => {
  const top = document.getElementById("evalTop");
  const bottom = document.getElementById("evalBottom");
  const text = document.getElementById("evalScore");
  const big = document.getElementById("evalBig");
  const mini = document.getElementById("evalMiniFill");
  if (!top || !bottom || !text) return;

  let score = 0, mate = false, percent = 50, label = "0.0";
  if (scoreStr) {
    scoreStr = String(scoreStr).trim();
    if (scoreStr.startsWith("#")) {
      mate = true;
      score = parseFloat(scoreStr.slice(1).replace("+", "")) || 0;
    } else {
      score = parseFloat(scoreStr.replace("+", "")) || 0;
    }
  }
  if (mate) {
    const sign = score > 0 ? "+" : "-";
    label = "#" + sign + Math.abs(score);
    percent = (score > 0 && color === "white") || (score < 0 && color === "black") ? 100 : 0;
  } else {
    label = (score > 0 ? "+" : "") + score.toFixed(1);
    const s = color === "black" ? -score : score;
    percent = s >= 7 ? 90 : s <= -7 ? 10 : 50 + (s / 7) * 40;
  }
  text.textContent = label;
  if (big) {
    big.textContent = label;
    big.classList.remove("tick");
    void big.offsetWidth;
    big.classList.add("tick");
  }
  if (mini) mini.style.width = percent + "%";

  if (color === "white") {
    top.style.background = "#211e1a";
    bottom.style.background = "linear-gradient(to top, #ffffff, #d9e2ec)";
  } else {
    top.style.background = "linear-gradient(to bottom, #ffffff, #d9e2ec)";
    bottom.style.background = "#211e1a";
  }
  top.style.height = 100 - percent + "%";
  bottom.style.height = percent + "%";
};

var clearHighlightSquares = () => {
  document.querySelectorAll(".customH").forEach((elm) => elm.remove());
};

var highlightMovesOnBoard = (moves, side) => {
  if (!Array.isArray(moves) || !moves.length) return;
  if (!((side === "w" && moves[0].fen.split(" ")[1] === "w") ||
        (side === "b" && moves[0].fen.split(" ")[1] === "b"))) {
    return;
  }
  if (chessConfig.onlyShowEval) return;

  const parent = document.querySelector('[class^="chessboard"]');
  if (!parent) return;

  const squareSize = parent.offsetWidth / 8;
  const maxMoves = 5;
  let colors = chessConfig.colors;
  parent.querySelectorAll(".customH").forEach((elm) => elm.remove());

  function squareToPosition(square) {
    const fileChar = square[0];
    const rank = parseInt(square[1], 10) - 1;
    let file, x, y;
    if (side === "w") {
      file = fileChar.charCodeAt(0) - "a".charCodeAt(0);
      y = (7 - rank) * squareSize;
      x = file * squareSize;
    } else {
      file = "h".charCodeAt(0) - fileChar.charCodeAt(0);
      y = rank * squareSize;
      x = file * squareSize;
    }
    return { x, y };
  }

  function drawArrow(fromSquare, toSquare, color, score) {
    const from = squareToPosition(fromSquare);
    const to = squareToPosition(toSquare);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "customH");
    svg.setAttribute("width", parent.offsetWidth);
    svg.setAttribute("height", parent.offsetWidth);
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.pointerEvents = "none";
    svg.style.overflow = "visible";
    svg.style.zIndex = "10";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    const mid = "ah" + Math.abs(hashStr(color + fromSquare + toSquare));
    marker.setAttribute("id", mid);
    marker.setAttribute("markerWidth", "3.5");
    marker.setAttribute("markerHeight", "2.5");
    marker.setAttribute("refX", "1.75");
    marker.setAttribute("refY", "1.25");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");
    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowPath.setAttribute("d", "M0,0 L3.5,1.25 L0,2.5 Z");
    arrowPath.setAttribute("fill", color);
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", from.x + squareSize / 2);
    line.setAttribute("y1", from.y + squareSize / 2);
    line.setAttribute("x2", to.x + squareSize / 2);
    line.setAttribute("y2", to.y + squareSize / 2);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "5");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("marker-end", `url(#${mid})`);
    line.setAttribute("opacity", "0.65");
    svg.appendChild(line);

    if (score !== undefined) {
      if (score === "book") {
        const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        foreignObject.setAttribute("x", to.x + squareSize - 12);
        foreignObject.setAttribute("y", to.y - 12);
        foreignObject.setAttribute("width", "24");
        foreignObject.setAttribute("height", "24");
        const div = document.createElement("div");
        div.innerHTML = bookSVG;
        foreignObject.appendChild(div);
        svg.appendChild(foreignObject);
      } else {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const textElm = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElm.setAttribute("x", to.x + squareSize);
        textElm.setAttribute("y", to.y);
        textElm.setAttribute("font-size", "9");
        textElm.setAttribute("font-weight", "bold");
        textElm.setAttribute("text-anchor", "middle");
        textElm.setAttribute("dominant-baseline", "middle");
        textElm.setAttribute("fill", color);
        let isNegative = false, displayScore = score;
        const hasHash = String(score).startsWith("#");
        let raw = hasHash ? String(score).slice(1) : String(score);
        if (raw.startsWith("-")) { isNegative = true; raw = raw.slice(1); }
        else if (raw.startsWith("+")) { raw = raw.slice(1); }
        displayScore = hasHash ? "#" + raw : raw;
        textElm.textContent = displayScore;
        group.appendChild(textElm);
        svg.appendChild(group);
        requestAnimationFrame(() => {
          try {
            const bbox = textElm.getBBox();
            const padX = 2, padY = 2;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", bbox.x - padX);
            rect.setAttribute("y", bbox.y - padY);
            rect.setAttribute("width", bbox.width + padX * 2);
            rect.setAttribute("height", bbox.height + padY * 2);
            rect.setAttribute("rx", "8");
            rect.setAttribute("ry", "8");
            rect.setAttribute("fill", isNegative ? "#312e2b" : "#ffffff");
            rect.setAttribute("fill-opacity", "0.85");
            rect.setAttribute("stroke", isNegative ? "#000000" : "#cccccc");
            rect.setAttribute("stroke-width", "1");
            group.insertBefore(rect, textElm);
          } catch (e) {}
        });
      }
    }
    parent.appendChild(svg);
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  parent.style.position = "relative";

  let filteredMoves = moves;
  if (chessConfig.winningMove) {
    filteredMoves = moves.filter((move) => {
      const evalValue = parseFloat(move.eval);
      if (side === "w") {
        return evalValue >= 2 || (String(move.eval).startsWith("#") && parseInt(String(move.eval).slice(1)) > 0);
      } else {
        return evalValue <= -2 || (String(move.eval).startsWith("#-") && parseInt(String(move.eval).slice(2)) > 0);
      }
    });
  }
  filteredMoves.slice(0, maxMoves).forEach((move, index) => {
    const color = colors[index] || "red";
    drawArrow(move.from, move.to, color, move.eval);
  });
};

/* ---- Move list side panel ---- */
let lastMoves = null;
function renderMoveList(moves) {
  const list = el("moveList");
  if (!list) return;
  if (!Array.isArray(moves) || !moves.length) {
    list.innerHTML = `<div class="move-empty">${t("waiting")}</div>`;
    return;
  }
  list.innerHTML = "";
  moves.slice(0, 5).forEach((m, i) => {
    const color = (chessConfig.colors && chessConfig.colors[i]) || "#34d399";
    const row = document.createElement("div");
    row.className = "move-item";
    row.style.animationDelay = i * 0.05 + "s";
    const rank = document.createElement("span");
    rank.className = "move-rank";
    rank.textContent = i + 1;
    const dot = document.createElement("span");
    dot.className = "move-dot";
    dot.style.background = color;
    dot.style.color = color;
    const uci = document.createElement("span");
    uci.className = "move-uci";
    uci.textContent = `${m.from} → ${m.to}`;
    const ev = document.createElement("span");
    ev.className = "move-eval";
    ev.textContent = m.eval === "book" ? "📖" : m.eval;
    row.append(rank, dot, uci, ev);
    list.appendChild(row);
  });
}

function updateSideBadge(side) {
  const txt = el("sideText");
  const badge = el("sideBadge");
  if (!txt || !badge) return;
  const isWhite = side === "white";
  txt.textContent = isWhite ? t("whiteMove") : t("blackMove");
  const pawn = badge.querySelector(".pawn");
  if (pawn) pawn.className = "pawn " + (isWhite ? "white" : "black");
}

try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TO_POPUP") {
      if (message.fen && board) {
        try { board.position(message.fen); } catch (e) {}
      }
      if (message.data) {
        const data = message.data;
        isLive = true;
        refreshStatus();
        updateEval(data[0].eval, data[0].side);
        if (board) {
          try { board.orientation(data[0].side); } catch (e) {}
        }
        updateSideBadge(data[0].side);
        clearHighlightSquares();
        highlightMovesOnBoard(data, data[0].side[0]);
        lastMoves = data;
        renderMoveList(data);
      }
    }
  });
} catch (e) {}
