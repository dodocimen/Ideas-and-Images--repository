/*
  kineticTypographyDejaVu.js (Responsive Font Size)
  - Dynamically reduces font size for words/phrases too long for the canvas width.
  - Keeps other effects: scramble/unscramble, red coloring.
  - Canvas height adjusts for mobile.
*/

let words = ["MEMORY", "BLURRED", "AGAIN", "SO FAMILIAR", "LOOPING", "UNKNOWN"]; // Added longer phrase
let customFont;

let currentIndex = 0;

let displayArray = [];
let targetArray = [];
let isRed = [];

// State management
let state = "SCRAMBLING";
let frameTimer = 0;
let holdDuration = 90;
let unscrambleSpeed = 0.02;
let scrambleSpeed = 0.09;

// Letter size - base ratio and current size
let currentLetterSize; // This will change dynamically
const letterSizeRatio = 0.45; // Base letter size as ~45% of canvas height

// --- Configuration ---
const defaultCanvasHeight = 200;
const mobileCanvasHeight = 130;
const mobileBreakpoint = 400;
const textPadding = 0.90; // Use 90% of canvas width for text

//=========================
// P5.js Lifecycle Functions
//=========================

function preload() {
  customFont = loadFont("./fonts/FrederickatheGreat-Regular.ttf"); // Ensure path is correct
}

function setup() {
  let container = document.querySelector(".typography-canvas.week4");
  if (!container) {
    console.error("Container element '.typography-canvas.week4' not found!");
    createCanvas(windowWidth, defaultCanvasHeight); // Fallback
    return;
  }

  let w = container.offsetWidth;
  let h = getDynamicCanvasHeight();

  let cnv = createCanvas(w, h);
  cnv.parent(container);

  textAlign(LEFT, CENTER);
  textFont(customFont);
  // Note: Initial text size set within initWord based on the first word

  initWord(words[currentIndex]); // Initialize and set initial text size
}

function draw() {
  let currentHeight = getDynamicCanvasHeight();
  if (height !== currentHeight) {
    windowResized(); // Adjust canvas if needed
  }

  let centerY = height / 2;
  background("#0300BF");

  // --- State Machine ---
  runStateMachine();

  // --- Drawing the display array ---
  // Ensure current dynamic size is applied before drawing/measuring
  textSize(currentLetterSize);
  drawDisplayArray(centerY);
}

function windowResized() {
  let container = document.querySelector(".typography-canvas.week4");
  if (!container) return;

  let w = container.offsetWidth;
  let h = getDynamicCanvasHeight();

  resizeCanvas(w, h);

  // Recalculate and apply the appropriate text size for the current word
  // based on the new canvas dimensions
  setCurrentTextSizeForWord(targetArray);
  textSize(currentLetterSize); // Apply the potentially new size
}

//=========================
// Helper Functions
//=========================

function getDynamicCanvasHeight() {
  // Prioritize checking windowWidth existence for safety
  const w = typeof windowWidth !== 'undefined' ? windowWidth : window.innerWidth;
  if (w <= mobileBreakpoint) {
    return mobileCanvasHeight;
  } else {
    return defaultCanvasHeight;
  }
}

// Calculates and sets the appropriate font size for the given word array
function setCurrentTextSizeForWord(wordArray) {
  if (!wordArray || wordArray.length === 0) {
      currentLetterSize = getDynamicCanvasHeight() * letterSizeRatio; // Default size
      return;
  }

  let baseLetterSize = getDynamicCanvasHeight() * letterSizeRatio;
  let availableWidth = width * textPadding; // Use 90% of width

  // Temporarily set base size to measure accurately
  textSize(baseLetterSize);
  let targetText = wordArray.join('');
  let targetWidth = textWidth(targetText);

  // If the word is too wide at the base size, calculate a smaller size
  if (targetWidth > availableWidth && availableWidth > 0) {
    let scaleFactor = availableWidth / targetWidth;
    currentLetterSize = baseLetterSize * scaleFactor;
  } else {
    // Otherwise, use the base size
    currentLetterSize = baseLetterSize;
  }
  // Ensure size is not excessively small
  currentLetterSize = max(currentLetterSize, 10); // Minimum font size of 10px
}


function runStateMachine() {
  if (state === "SCRAMBLING") {
    scrambleLetters(scrambleSpeed);
    frameTimer++;
    if (frameTimer > 60) {
      state = "UNSCRAMBLING";
      frameTimer = 0;
    }
  } else if (state === "UNSCRAMBLING") {
    unscrambleLetters(unscrambleSpeed);
    if (arraysMatch(displayArray, targetArray)) {
      state = "HOLD";
      frameTimer = 0;
    }
  } else if (state === "HOLD") {
    frameTimer++;
    if (frameTimer > holdDuration) {
      state = "TRANSITION";
      frameTimer = 0;
      currentIndex = (currentIndex + 1) % words.length;
      initWord(words[currentIndex]);
    }
  } else if (state === "TRANSITION") {
    scrambleLetters(scrambleSpeed);
    frameTimer++;
    if (frameTimer > 60) {
      state = "UNSCRAMBLING";
      frameTimer = 0;
    }
  }
}

function drawDisplayArray(centerY) {
  // Ensure text size is set correctly before measuring/drawing
  textSize(currentLetterSize);

  let wordStr = displayArray.join("");
  let totalW = textWidth(wordStr);
  let startX = width / 2 - totalW / 2; // Center the text horizontally
  let x = startX;

  for (let i = 0; i < displayArray.length; i++) {
    let letterColor = "#FFF"; // Default white

    if (state === "HOLD") {
      letterColor = "#FF0000";
    } else if (isRed[i] && displayArray[i] === targetArray[i]) {
      letterColor = "#FF0000";
    }

    fill(letterColor);
    // Check if displayArray[i] exists before drawing
    if (displayArray[i] !== undefined) {
       let charToDraw = displayArray[i];
       text(charToDraw, x, centerY);
       x += textWidth(charToDraw); // Advance x
    }
  }
}

// ============ Word Initialization ============ //

function initWord(newWord) {
  targetArray = newWord.split("");
  isRed = new Array(targetArray.length).fill(false);

  // Calculate and set the correct font size for this new word
  setCurrentTextSizeForWord(targetArray);
  // Apply this size immediately for consistent measurement/drawing
  textSize(currentLetterSize);

  displayArray = new Array(targetArray.length);
  for (let i = 0; i < displayArray.length; i++) {
    if (targetArray[i] === " ") {
      displayArray[i] = " ";
    } else {
      displayArray[i] = randomChar();
    }
  }

  state = "TRANSITION";
  frameTimer = 0;
}

// ============ Scramble / Unscramble Logic ============ //

function unscrambleLetters(prob) {
  for (let i = 0; i < displayArray.length; i++) {
    if (displayArray[i] !== targetArray[i]) {
      if (targetArray[i] === " ") {
        displayArray[i] = " ";
        continue;
      }
      if (random() < prob) {
        displayArray[i] = targetArray[i];
        isRed[i] = true;
      }
    } else if (displayArray[i] === targetArray[i] && targetArray[i] !== " ") {
      isRed[i] = true;
    }
  }
}

function scrambleLetters(prob) {
  for (let i = 0; i < displayArray.length; i++) {
    if (targetArray[i] === " ") {
      displayArray[i] = " ";
      continue;
    }
    if (random() < prob) {
      displayArray[i] = randomChar();
      isRed[i] = false;
    }
  }
}

// ============ Utilities ============ //

function randomChar() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?@#$%1234567890";
  return chars.charAt(floor(random(chars.length)));
}

function arraysMatch(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}