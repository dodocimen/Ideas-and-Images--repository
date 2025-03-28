/*
  kineticTypographyDejaVu.js
  A scramble → unscramble → transition effect with:
    - Each letter slowly turning red when unscrambled.
    - Once the entire word is unscrambled, the whole word stays red.
    - When scrambling again, it turns white.
    - Using a custom font: "FrederickatheGreat-Regular.ttf"

  Attach this script to an HTML file containing:
     <div class="typography-canvas week4"></div>
  and load p5.js above it:
     <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/p5.min.js"></script>
*/

let words = ["MEMORY","BLURRED", "AGAIN", "SO FAMILIAR", "LOOPING", "THIS MOMENT","UNKNOWN"];
let customFont;

let currentIndex = 0;
let nextIndex = 1;

let displayArray = [];
let targetArray = [];
let isRed = []; 

// State management
let state = "SCRAMBLING";
let frameTimer = 0;
let holdDuration = 90;
let unscrambleSpeed = 0.02;
let scrambleSpeed = 0.09;
let letterSize = 90;

function preload() {
  customFont = loadFont("./fonts/FrederickatheGreat-Regular.ttf");
}

function setup() {
  let container = document.querySelector(".typography-canvas.week4");
  let w = container.offsetWidth;
  let h = 200; // Fixed height (ensures no squishing)

  let cnv = createCanvas(w, h);
  cnv.parent(container);

  textAlign(LEFT, CENTER);
  textSize(letterSize);
  textFont(customFont);

  initWord(words[currentIndex]);
}

function draw() {
  background("#0300BF");

  let wordStr = displayArray.join("");
  let totalW  = textWidth(wordStr);
  let startX  = width / 2 - totalW / 2;
  let centerY = height / 2;

  // --- State Machine ---
  if (state === "SCRAMBLING") {
    scrambleLetters(scrambleSpeed);
    frameTimer++;
    if (frameTimer > 60) { 
      state = "UNSCRAMBLING";
      frameTimer = 0;
    }
  }
  else if (state === "UNSCRAMBLING") {
    unscrambleLetters(unscrambleSpeed);

    if (arraysMatch(displayArray, targetArray)) {
      state = "HOLD";
      frameTimer = 0;
    }
  }
  else if (state === "HOLD") {
    frameTimer++;
    if (frameTimer > holdDuration) {
      state = "TRANSITION";
      frameTimer = 0;
      currentIndex = (currentIndex + 1) % words.length;
      nextIndex = (currentIndex + 1) % words.length;
      initWord(words[currentIndex]); 
    }
  }
  else if (state === "TRANSITION") {
    scrambleLetters(scrambleSpeed);
    frameTimer++;
    if (frameTimer > 60) {
      state = "UNSCRAMBLING";
      frameTimer = 0;
    }
  }

  // --- Drawing the display array ---
  let x = startX;
  for (let i = 0; i < displayArray.length; i++) {
    let letterColor = "#FFF"; 

    if (state === "HOLD") {
      letterColor = "#FF0000"; 
    } else if (isRed[i]) {
      letterColor = "#FF0000"; 
    }

    fill(letterColor);
    text(displayArray[i], x, centerY);
    x += textWidth(displayArray[i]);
  }
}

// ============ Word Initialization ============ //

function initWord(newWord) {
  targetArray = newWord.split("");

  if (displayArray.length === 0) {
    displayArray = targetArray.slice(); 
    for (let i = 0; i < displayArray.length; i++) {
      if (displayArray[i] !== " ") {
        displayArray[i] = randomChar();
      }
    }
    isRed = new Array(displayArray.length).fill(false);
  } else {
    let maxLen = max(displayArray.length, targetArray.length);
    displayArray = padOrTrim(displayArray, maxLen);
    targetArray  = padOrTrim(targetArray, maxLen);
    isRed = new Array(maxLen).fill(false);
  }
}

// ============ Scramble / Unscramble ============ //

function unscrambleLetters(prob) {
  for (let i = 0; i < displayArray.length; i++) {
    if (displayArray[i] !== targetArray[i]) {
      if (random() < prob) {
        displayArray[i] = targetArray[i];
        isRed[i] = true;
      }
    }
  }
}

function scrambleLetters(prob) {
  for (let i = 0; i < displayArray.length; i++) {
    if (displayArray[i] === targetArray[i] && displayArray[i] !== " ") {
      if (random() < prob) {
        displayArray[i] = randomChar();
        isRed[i] = false; 
      }
    } else {
      if (random() < prob * 0.5 && displayArray[i] !== " ") {
        displayArray[i] = randomChar();
        isRed[i] = false;
      }
    }
  }
}

// ============ Utilities ============ //

function randomChar() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?@#$%1234567890";
  return chars.charAt(floor(random(chars.length)));
}

function arraysMatch(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function padOrTrim(arr, newLen) {
  let result = arr.slice();
  while (result.length < newLen) {
    result.push(randomChar());
  }
  if (result.length > newLen) {
    result = result.slice(0, newLen);
  }
  return result;
}

// Keep canvas responsive
function windowResized() {
  let container = document.querySelector(".typography-canvas.week4");
  let w = container.offsetWidth;
  let h = 200; // Fixed height

  resizeCanvas(w, h);
}
