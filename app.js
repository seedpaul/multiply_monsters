// Multiply Monsters - array model + keypad + feedback

const gridTable = document.getElementById("grid-table");
const rowsLabel = document.getElementById("rows-label");
const colsLabel = document.getElementById("cols-label");

const factorA = document.getElementById("factor-a");
const factorB = document.getElementById("factor-b");
const productSpan = document.getElementById("product");

const hintRows = document.getElementById("hint-rows");
const hintCols = document.getElementById("hint-cols");

const factRows = document.getElementById("fact-rows");
const factCols = document.getElementById("fact-cols");
const factProduct = document.getElementById("fact-product");
const factNote = document.getElementById("fact-note");
const gridShell = document.getElementById("grid-shell");
const appRoot = document.getElementById("app");
const gridSection = document.querySelector(".grid-section");

const stepRows = document.getElementById("step-rows");
const stepCols = document.getElementById("step-cols");
const stepCount = document.getElementById("step-count");

const newProblemBtn = document.getElementById("new-problem-btn");

// Answer / keypad
const answerValueSpan = document.getElementById("answer-value");
const keypadButtons = document.querySelectorAll(".key-btn");
const clearAnswerBtn = document.getElementById("clear-answer-btn");
const checkAnswerBtn = document.getElementById("check-answer-btn");
const feedbackEl = document.getElementById("feedback");
const feedbackOverlay = document.getElementById("feedback-overlay");
const feedbackModal = document.getElementById("feedback-modal");
const feedbackBody = document.getElementById("feedback-body");
const feedbackOk = document.getElementById("feedback-ok");
const celebrationLayer = document.getElementById("celebration-layer");

// Score / monster
const scoreCorrectSpan = document.getElementById("score-correct");
const scoreStreakSpan = document.getElementById("score-streak");
const MIN_ROWS = 1;
const MAX_ROWS = 12;
const MIN_COLS = 1;
const MAX_COLS = 12;

let currentRows = 0;
let currentCols = 0;
let currentAnswer = "";
let scoreCorrect = 0;
let scoreStreak = 0;
let touchedRows = false;
let touchedCols = false;
let countedGrid = false;
let selectionStart = null;
let isSelecting = false;
let currentSelectionHue = 0;
let gridScale = 1;

/* Helpers */

function getProduct() {
  return currentRows * currentCols;
}

function updateStatsDisplay() {
  scoreCorrectSpan.textContent = scoreCorrect;
  scoreStreakSpan.textContent = scoreStreak;
  const streakLevel = Math.max(scoreStreak, 0);
  const capped = Math.min(streakLevel, 50);
  const scale = 1 + capped * 0.18;
  const hue = 40 + capped * 6;
  const light = 60 + Math.min(capped * 0.8, 30);
  scoreStreakSpan.style.transform = `scale(${scale.toFixed(2)}) translateY(${-capped * 1.2}px)`;
  scoreStreakSpan.style.color = `hsl(${hue}, 85%, ${light}%)`;
  scoreStreakSpan.style.textShadow = `0 0 18px hsla(${hue}, 85%, ${light}%, 0.8)`;
  scoreStreakSpan.style.zIndex = 20 + capped;
  if (scoreStreak > 0 && scoreStreak % 5 === 0) {
    scoreStreakSpan.classList.add("streak-highlight");
    setTimeout(() => {
      scoreStreakSpan.classList.remove("streak-highlight");
    }, 700);
  }
}

function updateFactLine(showProduct) {
  factRows.textContent = currentRows;
  factCols.textContent = currentCols;
  factProduct.textContent = showProduct ? getProduct() : "?";
  factProduct.classList.toggle("revealed", Boolean(showProduct));
}

function fitAppToViewport() {
  if (!appRoot) return;
  const padding = 20;
  const availableW = window.innerWidth - padding;
  const availableH = window.innerHeight - padding;
  const rect = appRoot.getBoundingClientRect();
  const scale =
    0.95 *
    Math.min(
      1,
      availableW / Math.max(rect.width, 1),
      availableH / Math.max(rect.height, 1)
    );
  appRoot.style.setProperty("--app-scale", scale.toFixed(3));
}

function sizeGridShell() {
  if (!gridShell) return;
  const shellRect = gridShell.getBoundingClientRect();
  const parentRect = gridSection?.getBoundingClientRect();
  const availableFromViewport = Math.max(
    200,
    window.innerHeight * 0.7 - (shellRect.top || 0)
  );
  const availableFromParent =
    parentRect && gridShell.offsetTop
      ? parentRect.height -
        (gridShell.offsetTop - (gridSection?.offsetTop || 0)) -
        12
      : availableFromViewport;
  const height = Math.max(
    180,
    Math.min(availableFromViewport, availableFromParent || availableFromViewport)
  );
  gridShell.style.height = `${height}px`;
}

function fitGridToShell() {
  if (!gridShell || !gridTable) return;
  const shellRect = gridShell.getBoundingClientRect();
  const tableRect = gridTable.getBoundingClientRect();
  const scale = Math.min(
    1,
    (shellRect.width - 8) / Math.max(tableRect.width, 1),
    (shellRect.height - 8) / Math.max(tableRect.height, 1)
  );
  gridScale = scale;
  gridTable.style.transform = `scale(${scale})`;
}

function setCellSizing(rows, cols) {
  const shellRect = gridShell?.getBoundingClientRect();
  const availableWidth =
    shellRect && shellRect.width ? shellRect.width - 8 : 520;
  const shellInnerH =
    gridShell && gridShell.clientHeight ? gridShell.clientHeight : null;
  const availableHeight =
    shellInnerH && shellInnerH > 0
      ? shellInnerH - 4
      : shellRect && shellRect.height
      ? shellRect.height - 4
      : window.innerHeight * 0.6;

  const maxDim = Math.max(rows, cols);
  const idealByWidth = Math.floor(availableWidth / (cols + 1));
  const idealByHeight = Math.floor(availableHeight / (rows + 1));
  const ideal = Math.min(idealByWidth, idealByHeight);

  const size = Math.max(6, Math.min(44, ideal));
  const spacing = Math.max(1, Math.min(5, Math.floor(size / 14)));

  gridTable.style.setProperty("--cell-size", `${size}px`);
  gridTable.style.borderSpacing = `${spacing}px`;
  gridTable.style.width = "100%";
  gridTable.style.minWidth = "0";
}

function updateChecklist() {
  stepRows.classList.toggle("done", touchedRows);
  stepRows.classList.toggle("active", !touchedRows);

  stepCols.classList.toggle("done", touchedCols);
  stepCols.classList.toggle("active", !touchedCols && touchedRows);

  const canCount = touchedRows && touchedCols;
  stepCount.classList.toggle("done", countedGrid);
  stepCount.classList.toggle("active", canCount && !countedGrid);
}

function setFeedback(message, state) {
  feedbackEl.textContent = state === "neutral" ? message : "";

  feedbackEl.classList.remove(
    "feedback-neutral",
    "feedback-correct",
    "feedback-incorrect",
    "feedback-hidden"
  );
  factProduct.classList.remove("revealed");
  feedbackModal.classList.remove("modal-correct", "modal-incorrect");

  if (state === "correct") {
    feedbackEl.classList.add("feedback-correct", "feedback-hidden");
    factNote.textContent = "Nice! Rows x columns made the product.";
    feedbackModal.classList.add("modal-correct");
    showFeedbackDialog(
      "Thunderous win! You multiplied rows x columns to get the product. Keep the streak going!"
    );
    const intensity =
      1.2 + Math.min(scoreStreak, 10) * 0.2 + (scoreStreak % 5 === 0 ? 1.2 : 0);
    playCelebrationSong(intensity);
    spawnCelebrationBurst(intensity, scoreStreak);
  } else if (state === "incorrect") {
    feedbackEl.classList.add("feedback-incorrect", "feedback-hidden");
    factNote.textContent =
      "Look at the rows and columns, then try rows x columns again.";
    feedbackModal.classList.add("modal-incorrect");
    showFeedbackDialog(
      `That answer doesn't match this array. Remember: it's ${currentRows} rows of ${currentCols}; count rows x columns to find the total.`
    );
  } else {
    feedbackEl.classList.add("feedback-neutral");
    factNote.textContent = "Build the array, then count rows x columns.";
    hideFeedbackDialog();
  }
}

function updateAnswerDisplay() {
  if (!currentAnswer) {
    answerValueSpan.textContent = "?";
  } else {
    answerValueSpan.textContent = currentAnswer;
  }
}

function clearHighlights() {
  gridTable.querySelectorAll(".grid-tile").forEach((t) => {
    t.classList.remove("row-lit", "col-lit");
  });
}

function highlightRowCol(row, col) {
  gridTable.querySelectorAll(".grid-tile").forEach((t) => {
    const tRow = parseInt(t.dataset.row || "0", 10);
    const tCol = parseInt(t.dataset.col || "0", 10);
    t.classList.toggle("row-lit", tRow === row);
    t.classList.toggle("col-lit", tCol === col);
  });
}

function applySelection(start, end, hue) {
  if (!start || !end) return;
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  gridTable.querySelectorAll(".grid-tile").forEach((t) => {
    const tRow = parseInt(t.dataset.row || "0", 10);
    const tCol = parseInt(t.dataset.col || "0", 10);
    const inRect =
      tRow >= minRow && tRow <= maxRow && tCol >= minCol && tCol <= maxCol;
    if (inRect) {
      const h = typeof hue === "number" ? hue : currentSelectionHue;
      t.style.setProperty("--sel-hue", h.toString());
      t.classList.add("selected");
    }
  });
}

function clearSelections() {
  gridTable.querySelectorAll(".grid-tile").forEach((t) => {
    t.classList.remove("selected");
    t.style.removeProperty("--sel-hue");
  });
}

function resetForNewShape() {
  countedGrid = false;
  currentAnswer = "";
  factProduct.classList.remove("revealed");
  productSpan.textContent = "?";
  updateAnswerDisplay();
  updateFactLine(false);
  clearHighlights();
  clearSelections();
}

function showFeedbackDialog(text) {
  feedbackBody.textContent = text;
  feedbackOverlay.classList.remove("hidden");
  feedbackOverlay.classList.add("visible");
  feedbackModal.classList.remove("hidden");
  feedbackModal.classList.add("visible");
}

function hideFeedbackDialog() {
  feedbackOverlay.classList.add("hidden");
  feedbackOverlay.classList.remove("visible");
  feedbackModal.classList.add("hidden");
  feedbackModal.classList.remove("visible");
}

function spawnCelebrationBurst(intensity = 1, streakValue = 0) {
  if (!celebrationLayer) return;
  const sprites = [
    "🐱",
    "🐱‍👤",
    "🐒🥁",
    "🧑‍🏫",
    "🦄",
    "🐯",
    "🦊",
    "🕺",
    "🤸",
    "🦍",
    "🐉",
    "🤖",
    "🎉",
    "🎈",
    "🌈",
    "🪅",
    "🎊",
    "🪩",
    "🛸",
  ];
  const animations = ["celebration-fly", "celebration-spin", "celebration-bounce"];
  const count = Math.ceil((32 + Math.floor(Math.random() * 12)) * intensity);
  for (let i = 0; i < count; i += 1) {
    const el = document.createElement("div");
    el.className = `celebration-item ${
      animations[Math.floor(Math.random() * animations.length)]
    }`;
    el.textContent = sprites[Math.floor(Math.random() * sprites.length)];
    const x = Math.random() * 90;
    const y = Math.random() * 70 + 10;
    const delay = Math.random() * 0.5;
    const duration = 1.4 + Math.random() * 1.4 + intensity * 0.2;
    el.style.left = `${x}vw`;
    el.style.top = `${y}vh`;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;
    celebrationLayer.appendChild(el);
    el.addEventListener("animationend", () => {
      el.remove();
    });
  }

  // Confetti burst
  const confettiCount = Math.ceil(80 * intensity);
  for (let i = 0; i < confettiCount; i += 1) {
    const piece = document.createElement("div");
    piece.className = "celebration-item";
    piece.textContent = "✦";
    const x = Math.random() * 100;
    const delay = Math.random() * 0.3;
    const duration = 1.5 + Math.random() * 1.6 + intensity * 0.2;
    piece.style.left = `${x}vw`;
    piece.style.top = `-5vh`;
    piece.style.animation = `confetti ${duration}s ease-in ${delay}s forwards`;
    piece.style.color = `hsl(${Math.floor(Math.random() * 360)}, 80%, 70%)`;
    celebrationLayer.appendChild(piece);
    piece.addEventListener("animationend", () => {
      piece.remove();
    });
  }

  if (streakValue > 0 && streakValue % 5 === 0) {
    const badge = document.createElement("div");
    badge.className = "celebration-item streak-badge celebration-spin";
    badge.textContent = `🔥 Streak ${streakValue}!`;
    badge.style.left = "50vw";
    badge.style.top = "30vh";
    badge.style.animationDuration = `${1.6 + intensity * 0.3}s`;
    celebrationLayer.appendChild(badge);
    badge.addEventListener("animationend", () => {
      badge.remove();
    });
  }
}

function playCelebrationSong(intensity = 1) {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  const Actx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Actx();
  const master = ctx.createGain();
  const masterVol = (0.55 + Math.random() * 0.3) * Math.min(1.5, intensity);
  master.gain.setValueAtTime(masterVol, ctx.currentTime);
  master.connect(ctx.destination);

  const arps = [
    [261.63, 329.63, 392.0, 523.25, 659.25],
    [293.66, 370, 466.16, 587.33, 739.99],
    [329.63, 415.3, 523.25, 659.25, 830.61],
    [220, 277.18, 329.63, 415.3, 554.37],
    [246.94, 311.13, 369.99, 466.16, 622.25],
  ];
  const arp = arps[Math.floor(Math.random() * arps.length)];
  const baseDelay = Math.random() * 0.18;
  const types = ["triangle", "square", "sawtooth", "sine"];
  const typeMain = types[Math.floor(Math.random() * types.length)];

  const scheduleTone = (time, freq, duration, type = "sine", vol = 0.5) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + time);
    gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + time + duration
    );
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime + time);
    osc.stop(ctx.currentTime + time + duration + 0.05);
  };

  // Sweet/wild arpeggio
  arp.forEach((f, i) => {
    scheduleTone(
      baseDelay + i * 0.12,
      f,
      0.32 * Math.min(1.2, intensity),
      typeMain,
      (0.5 + Math.random() * 0.2) * Math.min(1.3, intensity)
    );
  });

  // Sparkle layer
  const sparkles = [880, 1175, 1320, 1560, 1975];
  sparkles.forEach((f, i) => {
    scheduleTone(
      baseDelay + 0.05 + i * 0.1,
      f,
      0.22 * Math.min(1.3, intensity),
      "sine",
      (0.2 + Math.random() * 0.2) * Math.min(1.4, intensity)
    );
  });

  // Bass thump
  scheduleTone(
    baseDelay,
    70 + Math.random() * 40,
    0.45 * Math.min(1.3, intensity),
    "sawtooth",
    0.4 * Math.min(1.4, intensity)
  );

  // Noise burst for “wild”
  const buffer = ctx.createBuffer(1, ctx.sampleRate * (0.3 + Math.random() * 0.25), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.001, ctx.currentTime);
  nGain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
  nGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
  noise.connect(nGain);
  nGain.connect(master);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.4);
}

/* Core UI updates */

function updateProblemDisplay(showProduct = false) {
  factorA.textContent = currentRows;
  factorB.textContent = currentCols;

  productSpan.textContent = showProduct ? getProduct() : "?";

  rowsLabel.textContent = currentRows;
  colsLabel.textContent = currentCols;

  hintRows.textContent = currentRows;
  hintCols.textContent = currentCols;

  updateFactLine(showProduct);
}

function renderGrid(rows, cols) {
  gridTable.innerHTML = "";
  sizeGridShell();
  setCellSizing(rows, cols);

  const baseHue = Math.floor(Math.random() * 360);
  const hueStep = 6;

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.className = "corner-cell spacer-cell";
  headRow.appendChild(corner);
  for (let c = 1; c <= cols; c += 1) {
    const th = document.createElement("th");
    th.className = "col-label";
    th.textContent = c;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  gridTable.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (let r = 1; r <= rows; r += 1) {
    const tr = document.createElement("tr");

    const rowTh = document.createElement("th");
    rowTh.className = "row-label";
    rowTh.textContent = r;
    tr.appendChild(rowTh);

    for (let c = 1; c <= cols; c += 1) {
      const td = document.createElement("td");
      const tile = document.createElement("div");
      tile.className = "grid-tile";
      tile.dataset.row = r.toString();
      tile.dataset.col = c.toString();
      // Use a smooth hue gradient across the grid that changes each problem.
      const hue = baseHue + (r - 1 + c - 1) * hueStep;
      tile.style.setProperty("--hue", (hue % 360).toString());

      const toggle = () => {
        tile.classList.toggle("on");
        countedGrid = true;
        updateChecklist();
      };

      tile.addEventListener("click", () => {
        if (isSelecting) return;
        toggle();
      });
      tile.addEventListener("mousedown", (ev) => {
        ev.preventDefault();
        isSelecting = true;
        currentSelectionHue = Math.floor(Math.random() * 360);
        selectionStart = { row: r, col: c };
        applySelection(selectionStart, selectionStart, currentSelectionHue);
      });
      tile.addEventListener(
        "mouseenter",
        () => {
          if (isSelecting && selectionStart) {
            applySelection(
              selectionStart,
              { row: r, col: c },
              currentSelectionHue
            );
          }
        },
        { passive: true }
      );
      tile.addEventListener(
        "touchstart",
        (ev) => {
          ev.preventDefault();
          isSelecting = true;
          currentSelectionHue = Math.floor(Math.random() * 360);
          selectionStart = { row: r, col: c };
          applySelection(selectionStart, selectionStart, currentSelectionHue);
        },
        { passive: false }
      );
      tile.addEventListener(
        "touchmove",
        (ev) => {
          const touch = ev.touches[0];
          const target = document.elementFromPoint(touch.clientX, touch.clientY);
          const tileEl = target && target.closest(".grid-tile");
          if (tileEl && isSelecting && selectionStart) {
            const tRow = parseInt(tileEl.dataset.row || "0", 10);
            const tCol = parseInt(tileEl.dataset.col || "0", 10);
            applySelection(
              selectionStart,
              { row: tRow, col: tCol },
              currentSelectionHue
            );
          }
        },
        { passive: false }
      );

      td.appendChild(tile);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  gridTable.appendChild(tbody);
  fitGridToShell();
  fitAppToViewport();
}

document.addEventListener("mouseup", () => {
  isSelecting = false;
  selectionStart = null;
});

document.addEventListener("touchend", () => {
  isSelecting = false;
  selectionStart = null;
});

function randomProblem() {
  // Keep the numbers reasonable for middle school practice.
  const weightedPick = (min, max) => {
    const roll = Math.random();
    const biasThreshold = 0.2; // 20% chance to pick from the lower range
    if (roll < biasThreshold) {
      return min + Math.floor(Math.random() * Math.min(3, max - min + 1));
    }
    return min + 2 + Math.floor(Math.random() * Math.max(0, max - min - 1));
  };

  currentRows = weightedPick(MIN_ROWS, MAX_ROWS);
  currentCols = weightedPick(MIN_COLS, MAX_COLS);

  touchedRows = true;
  touchedCols = true;
  resetForNewShape();
  setFeedback(
    "Study the rows and columns, then type how many tiles there are in total.",
    "neutral"
  );
  updateProblemDisplay();
  renderGrid(currentRows, currentCols);
  updateChecklist();
}

/* Events */

newProblemBtn.addEventListener("click", () => {
  randomProblem();
});

feedbackOk.addEventListener("click", hideFeedbackDialog);
feedbackOverlay.addEventListener("click", hideFeedbackDialog);
feedbackOk.addEventListener("click", () => {
  if (feedbackModal.classList.contains("modal-correct")) {
    randomProblem();
  }
});

window.addEventListener("resize", () => {
  sizeGridShell();
  fitGridToShell();
  fitAppToViewport();
});

/* Keypad handling */

keypadButtons.forEach((btn) => {
  const key = btn.getAttribute("data-key");
  const action = btn.getAttribute("data-action");

  btn.addEventListener(
    "click",
    () => {
      if (key !== null) {
        // Digit pressed
        if (currentAnswer.length < 5) {
          // Avoid leading zeros like "000"
          if (currentAnswer === "0") {
            currentAnswer = key;
          } else {
            currentAnswer += key;
          }
          updateAnswerDisplay();
          updateChecklist();
        }
      } else if (action === "back") {
        if (currentAnswer.length > 0) {
          currentAnswer = currentAnswer.slice(0, -1);
          updateAnswerDisplay();
          updateChecklist();
        }
      }
    },
    { passive: true }
  );
});

const clearAnswer = () => {
  currentAnswer = "";
  updateAnswerDisplay();
  updateChecklist();
};

clearAnswerBtn.addEventListener("click", clearAnswer);

checkAnswerBtn.addEventListener("click", () => {
  if (!currentAnswer) {
    setFeedback("Type your answer first using the keypad.", "neutral");
    return;
  }

  const expected = getProduct();
  const answerNum = parseInt(currentAnswer, 10);

  if (answerNum === expected) {
    scoreCorrect += 1;
    scoreStreak += 1;
    updateStatsDisplay();

    setFeedback(
      `Nice! ${currentRows} x ${currentCols} = ${expected}. New challenge ready!`,
      "correct"
    );

    // Reveal the product once correct.
    productSpan.textContent = expected.toString();
    updateFactLine(true);
    updateChecklist();
    feedbackOk.textContent = "Next question";
  } else {
    scoreStreak = 0;
    updateStatsDisplay();
    setFeedback(
      `Not quite. Try counting the tiles again - remember it's ${currentRows} rows of ${currentCols}.`,
      "incorrect"
    );
    currentAnswer = "";
    updateAnswerDisplay();
    updateChecklist();
    feedbackOk.textContent = "Got it";
    gridShell.classList.remove("flash");
    void gridShell.offsetWidth;
    gridShell.classList.add("flash");
  }
});

/* Initial render */

randomProblem();
updateStatsDisplay();
fitAppToViewport();
