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
let failCount = 0;      // Tracks how many times user has failed
let failThreshold = 1;  // After this many failures, fail **earlier** in the word

// Customizable failure words
let FAILURE_WORDS = ["NOPE", "AGAIN", "WRONG", "FAILED", "NOPE", "MISTAKE"];
let currentFailWord = ""; // Active fail word

// Store letter positions for placeholder (so it doesn't shift)
let letterPositions = [];
let totalWidth = 0;

// The last typed letter for the big background letter
let lastTypedLetter = "";

// Cursor blink settings
let cursorBlink = true;
const CURSOR_BLINK_INTERVAL = 30;

// ===== Customization Variables ===== //

// 1) Big background letter (user-typed) settings
let typedScale = 0.3;  // Relative to canvas width
let typedPosX = 0.5;   // 0.5 = center horizontally
let typedPosY = 0.3;   // Position vertically (adjust as desired)
let typedColor = "#625FF0";

// 2) Fail word style
let failWordSize = 60;           // Starting size
let failWordColor = "#720000";   // Fail word color
const FAIL_SIZE_INCREMENT = 15;  // Size increase per failure
const MAX_FAIL_SIZE = 140;       // Maximum fail word size

// 3) Placeholder style
let typedLettersColor = "white";   // Color for correctly typed letters
let placeholderColor = "#625FF0";  // Color for untyped letters

// Preload custom fonts
function preload() {
  inputFont = loadFont("./fonts/AmericanTypewriter-Regular.ttf");
  bgFont    = loadFont("./fonts/Babylonica-Regular.ttf");
  failFont  = loadFont("./fonts/BrokenDetroit-Regular.ttf");
}

function setup() {
  // Select the container with classes ".typography-canvas.week3"
  let container = document.querySelector(".typography-canvas.week3");
  // Use the container's dimensions directly
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  
  // Create a canvas with responsive dimensions and parent it to the container
  const canvas = createCanvas(w, h);
  canvas.parent(container);
  
  textAlign(LEFT, CENTER);
  textFont(inputFont);
  textSize(50);
  
  computeLetterPositions();
}

function draw() {
  // Choose background color based on fail state
  if (failTimer > 0) {
    background("red"); // Failing state
  } else {
    background("#0300BF"); // Normal state
  }
  
  // Only draw the big background letter if not failing
  if (failTimer === 0) {
    drawBackgroundLetter();
  }
  
  // If in fail state, shake and show the fail word
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
    // Not failing: show normal placeholder text
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

// Draw the big background letter (only if not failing)
function drawBackgroundLetter() {
  if (lastTypedLetter === "" || failTimer > 0) return; // Hide during fail
  
  push();
    textFont(bgFont);
    textAlign(CENTER, CENTER);
    textSize(width * typedScale);
    fill(typedColor);
    text(lastTypedLetter, width * typedPosX, height * typedPosY);
  pop();
}

// Draw the placeholder "FAILURE" with colored letters
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
  
  // Draw blinking cursor at the end of the typed letters
  if (cursorBlink) {
    let cursorX = startX + letterPositions[typedLen] + 5;
    stroke("#FFFFFF");
    strokeWeight(2);
    line(cursorX, -20, cursorX, 35);
  }
}

// Draw the failure word with increasing size
function drawFailWord() {
  push();
    textAlign(CENTER, CENTER);
    textFont(failFont);
    textSize(failWordSize);
    fill(failWordColor);
    text(currentFailWord, 0, 0);
  pop();
}

// ============ Input & Logic ============ //

function keyTyped() {
  if (failTimer > 0) return; // Ignore input during failure
  
  let typedChar = key.toUpperCase();
  lastTypedLetter = typedChar;
  
  let nextLetter = target.charAt(typedLen);
  
  if (typedChar === nextLetter) {
    // Force fail earlier based on fail count
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

// Calculate forced fail index based on number of failures
function getForcedFailIndex() {
  let baseFailIndex = target.length - 2; // Starts near the end
  let adjustedFailIndex = baseFailIndex - floor(failCount / failThreshold);
  return max(0, adjustedFailIndex);
}

// Trigger the failure mode and adjust parameters
function triggerFail() {
  failTimer = FAIL_DURATION;
  typedLen = 0;
  currentFailWord = random(FAILURE_WORDS);
  
  // Increase the fail word size up to a cap
  if (failWordSize < MAX_FAIL_SIZE) {
    failWordSize += FAIL_SIZE_INCREMENT;
    failWordSize = min(failWordSize, MAX_FAIL_SIZE);
  }
  
  // Increase fail count to make future forced fails occur earlier
  failCount++;
}

// Compute letter positions to keep the placeholder centered
function computeLetterPositions() {
  letterPositions = [];
  totalWidth = 0;
  
  for (let i = 0; i < target.length; i++) {
    let cw = textWidth(target[i]);
    letterPositions.push(totalWidth);
    totalWidth += cw;
  }
}

// Handle responsive resizing of the canvas
function windowResized() {
  // Select the same container used in setup
  let container = document.querySelector(".typography-canvas.week3");
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  resizeCanvas(w, h);
  computeLetterPositions();
}
