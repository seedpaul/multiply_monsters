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

const stepRows = document.getElementById("step-rows");
const stepCols = document.getElementById("step-cols");
const stepCount = document.getElementById("step-count");
const stepAnswer = document.getElementById("step-answer");

const newProblemBtn = document.getElementById("new-problem-btn");

// Answer / keypad
const answerValueSpan = document.getElementById("answer-value");
const keypadButtons = document.querySelectorAll(".key-btn");
const clearAnswerBtn = document.getElementById("clear-answer-btn");
const checkAnswerBtn = document.getElementById("check-answer-btn");
const feedbackEl = document.getElementById("feedback");

// Score / monster
const scoreCorrectSpan = document.getElementById("score-correct");
const scoreStreakSpan = document.getElementById("score-streak");
const monsterFace = document.getElementById("monster-face");

const MIN_ROWS = 8;
const MAX_ROWS = 13;
const MIN_COLS = 8;
const MAX_COLS = 10;

let currentRows = 0;
let currentCols = 0;
let currentAnswer = "";
let scoreCorrect = 0;
let scoreStreak = 0;
let touchedRows = false;
let touchedCols = false;
let countedGrid = false;

/* Helpers */

function getProduct() {
  return currentRows * currentCols;
}

function updateStatsDisplay() {
  scoreCorrectSpan.textContent = scoreCorrect;
  scoreStreakSpan.textContent = scoreStreak;
}

function updateFactLine(showProduct) {
  factRows.textContent = currentRows;
  factCols.textContent = currentCols;
  factProduct.textContent = showProduct ? getProduct() : "?";
  factProduct.classList.toggle("revealed", Boolean(showProduct));
}

function setCellSizing(rows, cols) {
  const maxDim = Math.max(rows, cols);
  const ideal = Math.floor(520 / (maxDim + 1));
  const size = Math.max(32, Math.min(64, ideal));
  const spacing = Math.max(4, Math.min(10, Math.floor(size / 8)));
  gridTable.style.setProperty("--cell-size", `${size}px`);
  gridTable.style.borderSpacing = `${spacing}px`;
}

function updateChecklist() {
  stepRows.classList.toggle("done", touchedRows);
  stepRows.classList.toggle("active", !touchedRows);

  stepCols.classList.toggle("done", touchedCols);
  stepCols.classList.toggle("active", !touchedCols && touchedRows);

  const canCount = touchedRows && touchedCols;
  stepCount.classList.toggle("done", countedGrid);
  stepCount.classList.toggle("active", canCount && !countedGrid);

  const hasAnswer = currentAnswer.length > 0;
  const showProduct = factProduct.classList.contains("revealed");
  stepAnswer.classList.toggle("done", showProduct);
  stepAnswer.classList.toggle("active", !showProduct && hasAnswer);
}

function setFeedback(message, state) {
  feedbackEl.textContent = message;

  feedbackEl.classList.remove(
    "feedback-neutral",
    "feedback-correct",
    "feedback-incorrect"
  );
  monsterFace.classList.remove("happy", "sad");
  factProduct.classList.remove("revealed");

  if (state === "correct") {
    feedbackEl.classList.add("feedback-correct");
    monsterFace.textContent = ":)";
    monsterFace.classList.add("happy");
    factNote.textContent = "Nice! Rows x columns made the product.";
  } else if (state === "incorrect") {
    feedbackEl.classList.add("feedback-incorrect");
    monsterFace.textContent = ":(";
    monsterFace.classList.add("sad");
    factNote.textContent =
      "Look at the rows and columns, then try rows x columns again.";
  } else {
    feedbackEl.classList.add("feedback-neutral");
    monsterFace.textContent = ":|";
    factNote.textContent = "Build the array, then count rows x columns.";
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

function resetForNewShape() {
  countedGrid = false;
  currentAnswer = "";
  factProduct.classList.remove("revealed");
  productSpan.textContent = "?";
  updateAnswerDisplay();
  updateFactLine(false);
  clearHighlights();
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
  setCellSizing(rows, cols);

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.className = "corner-cell";
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
      // Give each tile its own hue so the grid feels playful and varied.
      const hue = Math.floor(Math.random() * 360);
      tile.style.setProperty("--hue", hue.toString());

      const toggle = () => {
        tile.classList.toggle("on");
        countedGrid = true;
        updateChecklist();
      };

      tile.addEventListener("click", () => {
        toggle();
        highlightRowCol(r, c);
      });
      tile.addEventListener(
        "touchstart",
        (ev) => {
          ev.preventDefault();
          toggle();
          highlightRowCol(r, c);
        },
        { passive: false }
      );

      tile.addEventListener(
        "mouseenter",
        () => {
          highlightRowCol(r, c);
        },
        { passive: true }
      );

      tile.addEventListener(
        "mouseleave",
        () => {
          clearHighlights();
        },
        { passive: true }
      );

      td.appendChild(tile);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  gridTable.appendChild(tbody);
}

function randomProblem() {
  // Keep the numbers reasonable for middle school practice.
  currentRows =
    MIN_ROWS + Math.floor(Math.random() * (MAX_ROWS - MIN_ROWS + 1));
  currentCols =
    MIN_COLS + Math.floor(Math.random() * (MAX_COLS - MIN_COLS + 1));

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

    // Auto-advance to a new problem after a short delay.
    setTimeout(() => {
      randomProblem();
    }, 900);
  } else {
    scoreStreak = 0;
    updateStatsDisplay();
    setFeedback(
      `Not quite. Try counting the tiles again - remember it's ${currentRows} rows of ${currentCols}.`,
      "incorrect"
    );
    gridShell.classList.remove("flash");
    void gridShell.offsetWidth;
    gridShell.classList.add("flash");
  }
});

/* Initial render */

randomProblem();
updateStatsDisplay();
