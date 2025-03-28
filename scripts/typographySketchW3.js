// typographySketchFailure.js
// User must type "FAILURE", but progressively fails sooner each time.

let inputFont; // Font for input & placeholder
let bgFont;    // Font for large background letter
let failFont;  // Font for failure words

let target = "FAILURE";
let typedLen = 0;       // Correct letters typed
let failTimer = 0;      // Timer for fail effect
const FAIL_DURATION = 30 * 0.5; // ~1.5 seconds

// Failure progression system
let failCount = 0;  // Tracks how many times user has failed
let failThreshold = 1;  // After this many failures, fail **earlier** in the word

// User can customize or add more fail words here.
let FAILURE_WORDS = ["TRY AGAIN","AGAIN", "WRONG", "FAILED", "NOPE", "MISTAKEN","NOT QUITE","INCORRECT"];
let currentFailWord = ""; // Active fail word

// Store letter positions (placeholder doesn't shift)
let letterPositions = [];
let totalWidth = 0;

// The last typed letter for the big background letter
let lastTypedLetter = "";

// Cursor blink
let cursorBlink = true;  
const CURSOR_BLINK_INTERVAL = 30; 

// ===== Customization Variables ===== //

// 1) Big background letter (user-typed) settings
let typedScale = 0.3;            // relative to canvas width
let typedPosX = 0.5;             // 0.5 = center horizontally
let typedPosY = 0.3;             // 0.5 = center vertically
let typedColor = "#625FF0";

// 2) Fail word style
let failWordSize = 60;           // starting point
let failWordColor = "#720000";   // color for fail words
const FAIL_SIZE_INCREMENT = 15;  // how much to grow each fail
const MAX_FAIL_SIZE = 140;       // max possible size

// 3) Placeholder style
let typedLettersColor = "white";  // letters the user typed so far
let placeholderColor   = "#625FF0"; // letters not typed yet

function preload() {
  inputFont = loadFont("./fonts/AmericanTypewriter-Regular.ttf");
  bgFont    = loadFont("./fonts/Babylonica-Regular.ttf");
  failFont  = loadFont("./fonts/BrokenDetroit-Regular.ttf");
}

function setup() {
 // Select the specific `.typography-canvas.week3` container
 let container = document.querySelector(".typography-canvas.week3");
 let w = container.offsetWidth;
 let h = w / 3; // Maintain 3:1 aspect ratio

  const canvas = createCanvas(w, h);
  canvas.parent("typography-canvas");

  textAlign(LEFT, CENTER);
  textFont(inputFont);
  textSize(50);

  computeLetterPositions();
}

function draw() {
  // 1) Choose background color
  if (failTimer > 0) {
    background("red"); // failing
  } else {
    background("#0300BF"); // normal
  }

  // 2) Only draw big background letter if NOT failing
  if (failTimer === 0) {
    drawBackgroundLetter();
  }

  // 3) If failing => shake & fail word
  if (failTimer > 0) {
    failTimer--;
    let shakeAmt = 5;
    let offsetX = random(-shakeAmt, shakeAmt);
    let offsetY = random(-shakeAmt, shakeAmt);

    push();
      translate(width / 2 + offsetX, height / 2 + offsetY);
      drawFailWord();
    pop();
  } else {
    // not failing => normal placeholder
    push();
      translate(width / 2, height / 2);
      drawPlaceholder();
    pop();
  }

  // Blink the cursor every few frames
  if (frameCount % CURSOR_BLINK_INTERVAL === 0) {
    cursorBlink = !cursorBlink;
  }
}

// ============ Draw Functions ============ //

// Draw the big background letter that user typed (ONLY if not failing)
function drawBackgroundLetter() {
  if (lastTypedLetter === "" || failTimer > 0) return; // **Hide during fail state**

  push();
    textFont(bgFont);
    textAlign(CENTER, CENTER);
    textSize(width * typedScale);
    fill(typedColor);
    text(lastTypedLetter, width * typedPosX, height * typedPosY);
  pop();
}

// Draw placeholder "FAILURE" with typed letters in one color, untyped in another
function drawPlaceholder() {
  let startX = -totalWidth / 2;

  for (let i = 0; i < target.length; i++) {
    let xPos = startX + letterPositions[i];
    let letter = target[i];

    if (i < typedLen) {
      fill(typedLettersColor); 
    } else {
      fill(placeholderColor);
    }
    text(letter, xPos, 0);
  }

  // Draw blinking cursor at the end of input if not failing
  if (cursorBlink) {
    let cursorX = startX + letterPositions[typedLen] + 5;
    stroke("#FFFFFF");
    strokeWeight(2);
    line(cursorX, -20, cursorX, 35);
  }
}

// Draw fail word with bigger & bigger size
function drawFailWord() {
  push();
    textAlign(CENTER, CENTER);
    textFont(failFont);
    textSize(failWordSize);
    fill(failWordColor);
    text(currentFailWord, 0, 0);
  pop();
}

// ============ Logic ============ //

function keyTyped() {
  if (failTimer > 0) return; // Ignore input while failing

  let typedChar = key.toUpperCase();
  lastTypedLetter = typedChar;

  let nextLetter = target.charAt(typedLen);

  if (typedChar === nextLetter) {
    // **Force fail earlier based on fail count**
    let forcedFailIndex = getForcedFailIndex();
    if (typedLen >= forcedFailIndex) {
      triggerFail();
      return;
    }
    typedLen++;
  } else {
    triggerFail();
  }
}

// Determines where the **forced fail** happens based on how many times user failed
function getForcedFailIndex() {
  let baseFailIndex = target.length - 2; // Starts at 'R' or 'E'
  
  // As user fails more, move fail point backwards in the word
  let adjustedFailIndex = baseFailIndex - floor(failCount / failThreshold);

  // Prevent failing before the word starts
  return max(0, adjustedFailIndex);
}

// Triggers a fail mode, progressing difficulty
function triggerFail() {
  failTimer = FAIL_DURATION;
  typedLen = 0; 
  currentFailWord = random(FAILURE_WORDS);

  // Scale up fail word size but cap it
  if (failWordSize < MAX_FAIL_SIZE) {
    failWordSize += FAIL_SIZE_INCREMENT;
    failWordSize = min(failWordSize, MAX_FAIL_SIZE);
  }

  // Increase fail count => makes force-fail happen **earlier** next time
  failCount++;
}

// Computes letter positions so placeholder doesn't shift
function computeLetterPositions() {
  letterPositions = [];
  totalWidth = 0;

  for (let i = 0; i < target.length; i++) {
    let cw = textWidth(target[i]);
    letterPositions.push(totalWidth);
    totalWidth += cw;
  }
}

// Handle responsive canvas
function windowResized() {
  const container = document.getElementById("typography-canvas");
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  resizeCanvas(w, h);
  computeLetterPositions();
}
