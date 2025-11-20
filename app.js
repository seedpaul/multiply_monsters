// Multiply Monsters – array model + keypad + feedback

const gridContainer = document.getElementById("grid-container");
const rowsSlider = document.getElementById("rows-slider");
const colsSlider = document.getElementById("cols-slider");
const rowsLabel = document.getElementById("rows-label");
const colsLabel = document.getElementById("cols-label");

const factorA = document.getElementById("factor-a");
const factorB = document.getElementById("factor-b");
const productSpan = document.getElementById("product");

const hintRows = document.getElementById("hint-rows");
const hintCols = document.getElementById("hint-cols");

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

let currentRows = parseInt(rowsSlider.value, 10);
let currentCols = parseInt(colsSlider.value, 10);
let currentAnswer = "";
let scoreCorrect = 0;
let scoreStreak = 0;

/* Helpers */

function getProduct() {
  return currentRows * currentCols;
}

function updateStatsDisplay() {
  scoreCorrectSpan.textContent = scoreCorrect;
  scoreStreakSpan.textContent = scoreStreak;
}

function setFeedback(message, state) {
  feedbackEl.textContent = message;

  feedbackEl.classList.remove(
    "feedback-neutral",
    "feedback-correct",
    "feedback-incorrect"
  );
  monsterFace.classList.remove("happy", "sad");

  if (state === "correct") {
    feedbackEl.classList.add("feedback-correct");
    monsterFace.textContent = "😺";
    monsterFace.classList.add("happy");
  } else if (state === "incorrect") {
    feedbackEl.classList.add("feedback-incorrect");
    monsterFace.textContent = "😿";
    monsterFace.classList.add("sad");
  } else {
    feedbackEl.classList.add("feedback-neutral");
    monsterFace.textContent = "🧡";
  }
}

function updateAnswerDisplay() {
  if (!currentAnswer) {
    answerValueSpan.textContent = "?";
  } else {
    answerValueSpan.textContent = currentAnswer;
  }
}

/* Core UI updates */

function updateProblemDisplay() {
  factorA.textContent = currentRows;
  factorB.textContent = currentCols;

  // We hide the product until the student gets it right.
  productSpan.textContent = "?";

  rowsLabel.textContent = currentRows;
  colsLabel.textContent = currentCols;

  hintRows.textContent = currentRows;
  hintCols.textContent = currentCols;

  setFeedback(
    "Tap the tiles to see the array, then type how many tiles there are in total.",
    "neutral"
  );
  currentAnswer = "";
  updateAnswerDisplay();
}

function renderGrid(rows, cols) {
  gridContainer.innerHTML = "";

  gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const total = rows * cols;

  for (let i = 0; i < total; i += 1) {
    const tile = document.createElement("div");
    tile.className = "grid-tile";

    const toggle = () => {
      tile.classList.toggle("on");
    };

    tile.addEventListener("click", toggle, { passive: true });
    tile.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
        toggle();
      },
      { passive: false }
    );

    gridContainer.appendChild(tile);
  }
}

function randomProblem() {
  // Keep the numbers reasonable for middle school practice.
  currentRows = 2 + Math.floor(Math.random() * 10); // 2–11
  currentCols = 2 + Math.floor(Math.random() * 10); // 2–11

  rowsSlider.value = currentRows;
  colsSlider.value = currentCols;

  updateProblemDisplay();
  renderGrid(currentRows, currentCols);
}

/* Events */

rowsSlider.addEventListener("input", () => {
  currentRows = parseInt(rowsSlider.value, 10);
  updateProblemDisplay();
  renderGrid(currentRows, currentCols);
});

colsSlider.addEventListener("input", () => {
  currentCols = parseInt(colsSlider.value, 10);
  updateProblemDisplay();
  renderGrid(currentRows, currentCols);
});

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
        if (currentAnswer.length < 4) {
          // Avoid leading zeros like "000"
          if (currentAnswer === "0") {
            currentAnswer = key;
          } else {
            currentAnswer += key;
          }
          updateAnswerDisplay();
        }
      } else if (action === "clear") {
        currentAnswer = "";
        updateAnswerDisplay();
      } else if (action === "back") {
        if (currentAnswer.length > 0) {
          currentAnswer = currentAnswer.slice(0, -1);
          updateAnswerDisplay();
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
      `Nice! ${currentRows} × ${currentCols} = ${expected}. New challenge ready!`,
      "correct"
    );

    // Reveal the product once correct.
    productSpan.textContent = expected.toString();

    // Auto-advance to a new problem after a short delay.
    setTimeout(() => {
      randomProblem();
    }, 900);
  } else {
    scoreStreak = 0;
    updateStatsDisplay();
    setFeedback(
      `Not quite. Try counting the tiles again – remember it's ${currentRows} rows of ${currentCols}.`,
      "incorrect"
    );
  }
});

/* Initial render */

updateProblemDisplay();
renderGrid(currentRows, currentCols);
updateStatsDisplay();
