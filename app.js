// Multiply Monsters - array model + keypad + feedback

const gridContainer = document.getElementById("grid-container");
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
const rulerTop = document.getElementById("ruler-top");
const rulerLeft = document.getElementById("ruler-left");
const gridShell = document.getElementById("grid-shell");

const stepRows = document.getElementById("step-rows");
const stepCols = document.getElementById("step-cols");
const stepCount = document.getElementById("step-count");
const stepAnswer = document.getElementById("step-answer");

const newProblemBtn = document.getElementById("new-problem-btn");

// Answer / keypad
const answerValueSpan = document.getElementById("answer-value");
const keypadButtons = document.querySelectorAll(".key-btn");
const checkAnswerBtn = document.getElementById("check-answer-btn");
const feedbackEl = document.getElementById("feedback");

// Score / monster
const scoreCorrectSpan = document.getElementById("score-correct");
const scoreStreakSpan = document.getElementById("score-streak");
const monsterFace = document.getElementById("monster-face");

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

function updateRulers(rows, cols) {
  rulerTop.innerHTML = "";
  rulerLeft.innerHTML = "";

  rulerTop.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  rulerLeft.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  for (let c = 1; c <= cols; c += 1) {
    const mark = document.createElement("div");
    mark.className = "mark";
    mark.textContent = c;
    rulerTop.appendChild(mark);
  }

  for (let r = 1; r <= rows; r += 1) {
    const mark = document.createElement("div");
    mark.className = "mark";
    mark.textContent = r;
    rulerLeft.appendChild(mark);
  }
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
  gridContainer.querySelectorAll(".grid-tile").forEach((t) => {
    t.classList.remove("row-lit", "col-lit");
  });
}

function highlightRowCol(row, col) {
  gridContainer.querySelectorAll(".grid-tile").forEach((t) => {
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
  gridContainer.innerHTML = "";
  updateRulers(rows, cols);

  gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const total = rows * cols;

  for (let i = 0; i < total; i += 1) {
    const rowIndex = Math.floor(i / cols) + 1;
    const colIndex = (i % cols) + 1;

    const tile = document.createElement("div");
    tile.className = "grid-tile";
    tile.dataset.row = rowIndex.toString();
    tile.dataset.col = colIndex.toString();
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
      highlightRowCol(rowIndex, colIndex);
    });
    tile.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
        toggle();
        highlightRowCol(rowIndex, colIndex);
      },
      { passive: false }
    );

    tile.addEventListener(
      "mouseenter",
      () => {
        highlightRowCol(rowIndex, colIndex);
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

    gridContainer.appendChild(tile);
  }
}

function randomProblem() {
  // Keep the numbers reasonable for middle school practice.
  currentRows = 2 + Math.floor(Math.random() * 10); // 2-11
  currentCols = 2 + Math.floor(Math.random() * 10); // 2-11

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
      } else if (action === "clear") {
        currentAnswer = "";
        updateAnswerDisplay();
        updateChecklist();
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
