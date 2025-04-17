/*
  wanderingHomesickWords.js (Prettier Aesthetics + Mobile Optimized)
  - Aesthetic enhancements:
      - Softer color palette (words, beams, house)
      - Smoother flicker using Perlin noise
      - Rounded corners on house base
      - Beams fade with length
      - Simple blast visual effect
  - Retains mobile optimizations and other features.
*/

// Word states
const WANDER = 0;
const HIDING = 1;
const BLAST = 2;
const DRAG = 3;

// --- Mobile Optimization Configuration ---
const mobileBreakpoint = 400;
const mobileWordCount = 12;
const desktopBackgroundAlpha = 20; // Slightly less trail for clarity
const mobileBackgroundAlpha = 40;
const desktopBeamCountRange = [10, 18]; // Reduced max beams
const mobileBeamCountRange = [6, 10];   // Further reduced beams on mobile
const desktopWanderSpeed = 1.5;
const mobileWanderSpeed = 2.0;
const desktopBlastSpeedRange = [4, 7];
const mobileBlastSpeedRange = [55, 10];
// --- End Mobile Optimization ---

// --- House Dimension Configuration ---
const desktopHouseWidthRatio = 0.18;
const desktopHouseHeightRatio = 0.25;
const mobileHouseWidthRatio = 0.28;
const mobileHouseHeightRatio = 0.20;
// --- End Configuration ---

// --- Aesthetics Configuration ---
const houseBaseColor = '#000050'; // Very dark blue
const houseRoofColor = '#00006A'; // Slightly lighter dark blue
const houseCornerRadius = 5;      // Rounded corners for house base
const wordColor = '#FFFFE0';      // Light yellow / Ivory
const beamHueMin = 180;           // Cooler Cyan/Blue range start
const beamHueMax = 240;           // Blue/Violet range end
const blastEffectColor = '#ffeb68'; // yellow blast
// --- End Aesthetics Configuration ---


// Only one word can hide at a time
let activeHidingWord = null;
let draggedWord = null;

// Custom font & container reference
let customFont;
let container;

// House dimensions
let houseW, houseH, houseX, houseY;

// Blast effect variables
let blastX = 0, blastY = 0, blastRadius = 0, blastMaxRadius = 0, blastAlpha = 0;
const blastExpandSpeed = 5;
const blastFadeSpeed = 10;

const allWords = [
  "LONELY", "DISTANT", "HOME", "NOSTALGIA", "INSPIRED", "SAD", "FAMILY",
  "FRIENDS", "LOVE", "HAPPY", "DREAMS", "HOPE", "PEACE", "FAITH", "COURAGE",
  "STRENGTH", "HEALING", "ISOLATION", "JOY", "LAUGHTER", "WANDERING",
  "WISDOM", "TRUST", "PATIENCE", "HONESTY", "ACHE", "SAFE", "ROOTS",
  "COMFORT", "GROWTH", "RESILIENCE", "CURIOSITY", "CREATIVITY", "LEARNING",
  "PASSION"
];
let wordObjects = [];

function preload() {
  customFont = loadFont('./fonts/RoadRage-Regular.ttf');
}

function setup() {
  container = document.getElementById("typography-canvas");
  if (!container) {
    console.error("Container #typography-canvas not found!");
    createCanvas(windowWidth, 400);
    calculateHouseDimensions();
  } else {
    let w = container.offsetWidth;
    let h = container.offsetHeight;
    let cnv = createCanvas(w, h);
    cnv.parent(container);
    calculateHouseDimensions();
  }

  textFont(customFont);
  noiseSeed(millis()); // Seed noise for flicker

  let wordsToUse;
  let isMobile = windowWidth <= mobileBreakpoint;
  if (isMobile) {
    wordsToUse = allWords.slice(0, mobileWordCount);
    console.log(`Mobile detected. Using ${mobileWordCount} words.`);
  } else {
    wordsToUse = allWords;
    console.log(`Desktop detected. Using ${allWords.length} words.`);
  }

  wordObjects = [];
  for (let w of wordsToUse) {
    wordObjects.push(createWordObject(w));
  }
}

function windowResized() {
  if (!container) {
     resizeCanvas(windowWidth, 400);
     calculateHouseDimensions();
     return;
  };
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  resizeCanvas(w, h);
  calculateHouseDimensions();
}

function calculateHouseDimensions() {
  let widthRatio, heightRatio;
  if (windowWidth <= mobileBreakpoint) {
      widthRatio = mobileHouseWidthRatio;
      heightRatio = mobileHouseHeightRatio;
  } else {
      widthRatio = desktopHouseWidthRatio;
      heightRatio = desktopHouseHeightRatio;
  }
  houseW = width * widthRatio;
  houseH = height * heightRatio;
  houseX = width / 2 - houseW / 2;
  houseY = height / 2 - houseH / 2;
  houseW = max(0, houseW || 0);
  houseH = max(0, houseH || 0);
  houseX = houseX || 0;
  houseY = houseY || 0;
}

function draw() {
  let bgAlpha = (windowWidth <= mobileBreakpoint) ? mobileBackgroundAlpha : desktopBackgroundAlpha;
  background(3, 0, 191, bgAlpha);

  // Draw blast effect (if active)
  drawBlastEffect();

  if (activeHidingWord) {
    drawUnrestrictedBeams();
  }
  drawHouse(); // Draw house potentially over beams/blast

  for (let w of wordObjects) {
    updateWord(w);
    displayWord(w); // Words generally on top
  }
}

// --- Drawing Functions ---

function drawBlastEffect() {
    if (blastAlpha > 0) {
        push();
        noFill();
        let blastColor = color(blastEffectColor);
        blastColor.setAlpha(blastAlpha);
        stroke(blastColor);
        strokeWeight(2 + (blastMaxRadius - blastRadius) * 0.05); // Thicker when smaller
        ellipse(blastX, blastY, blastRadius * 2, blastRadius * 2);
        pop();

        // Update blast animation
        blastRadius += blastExpandSpeed;
        blastAlpha -= blastFadeSpeed;
        blastAlpha = max(0, blastAlpha); // Ensure alpha doesn't go below 0
    }
}

function drawUnrestrictedBeams() {
  push();
  translate(houseX + houseW / 2, houseY + houseH * 0.8);

  let beams = activeHidingWord.beamCount;
  for (let i = 0; i < beams; i++) {
    // --- Reduce angle noise ---
    let angle = (TWO_PI / beams) * i + noise(activeHidingWord.x * 0.01, i) * 0.1 - 0.05; // Less noise influence
    // --- End modification ---
    let beamLen = random(activeHidingWord.beamMinLength, activeHidingWord.beamMaxLength);
    let sw = random(activeHidingWord.beamStrokeMin, activeHidingWord.beamStrokeMax);
    strokeWeight(sw);

    colorMode(HSB);
    let alphaVariance = 15; // Reduced variance
    // --- Make alpha fade more based on length ---
    let lengthRatio = map(beamLen, activeHidingWord.beamMinLength, activeHidingWord.beamMaxLength, 1, 0.2); // Fade to 20% alpha at max length
    // --- End modification ---
    let baseAlpha = random(max(0, activeHidingWord.beamAlpha - alphaVariance), min(100, activeHidingWord.beamAlpha + alphaVariance));
    let finalAlpha = baseAlpha * lengthRatio;

    stroke(activeHidingWord.beamHue, activeHidingWord.beamSat, activeHidingWord.beamBright, finalAlpha);

    let x2 = cos(angle) * beamLen;
    let y2 = sin(angle) * beamLen;
    line(0, 0, x2, y2);
  }
  pop();
  colorMode(RGB);
}

function drawHouse() {
  push(); // Isolate house drawing styles
  noStroke();
  // Roof
  fill(houseRoofColor);
  triangle(houseX, houseY + houseH * 0.2,
           houseX + houseW, houseY + houseH * 0.2,
           houseX + houseW / 2, houseY);
  // Base with rounded corners
  fill(houseBaseColor);
  rect(houseX, houseY + houseH * 0.2, houseW, houseH * 0.8, 0, 0, houseCornerRadius, houseCornerRadius); // Bottom corners rounded
  pop();
}


function displayWord(w) {
  // REMOVED: if (w.state === HIDING) return; // We now draw it dimly when hiding

  push();
  translate(w.x, w.y); // Translate to word's position (center of house if hiding)
  textAlign(CENTER, CENTER);
  let scaleVal = w.currentScale;

  if (w.state === HIDING) {
      // --- Draw word dimly when hiding ---
      let hidingSize = w.size * scaleVal * 1; // Make it smaller when hiding
      textSize(hidingSize);
      // Use a very dark, low-alpha color
      let hidingColor = color(250, 250, 20, 250); // Dark bluish-grey, low alpha (adjust as needed)
      fill(hidingColor);
      noStroke(); // Ensure no stroke makes it too visible
      text(w.txt, 0, 5); // Draw at the translated center point
      // --- End hiding draw style ---

  } else {
      // --- Normal drawing logic for WANDER, BLAST, DRAG states ---
      textSize(w.size * scaleVal);

      // Smoother Flicker using noise
      let flickerNoise = noise(w.x * 0.05, w.y * 0.05, frameCount * 0.05);
      let alphaVal = map(flickerNoise, 0, 1, 150, 255);

      let baseColor = color(wordColor); // Use the defined word color
      baseColor.setAlpha(alphaVal);

      // Glow effect removed previously

      fill(baseColor);
      text(w.txt, 0, 0);
      // --- End normal drawing ---
  }

  pop();
}

// --- Object Creation & State Management ---

function createWordObject(txt) {
  let relativeSize = random(height * 0.04, height * 0.08);
  relativeSize = max(relativeSize, 12);

  let maxSpeed = (windowWidth <= mobileBreakpoint) ? mobileWanderSpeed : desktopWanderSpeed;
  let initialVX = random(-maxSpeed, maxSpeed);
  let initialVY = random(-maxSpeed, maxSpeed);

  return {
    txt: txt,
    x: random(width),
    y: random(height),
    vx: initialVX,
    vy: initialVY,
    state: WANDER,
    timer: 0,
    hidingDuration: floor(random(40, 70)),
    blastDuration: floor(random(80, 120)),
    size: relativeSize,
    // flicker property removed, using noise directly in displayWord
    currentScale: 1.0,
    targetScale: 1.0,
    originalVX: 0,
    originalVY: 0,
    beamCount: 0, beamMinLength: 0, beamMaxLength: 0, beamStrokeMin: 0,
    beamStrokeMax: 0, beamHue: 0, beamSat: 0, beamBright: 0, beamAlpha: 0
  };
}

function updateWord(w) {
  w.currentScale = lerp(w.currentScale, w.targetScale, 0.15);

  if (w.state === WANDER) {
    w.x += w.vx;
    w.y += w.vy;
    keepInBounds(w);
    if (!activeHidingWord && w.state !== DRAG && collidesWithHouse(w)) {
      enterHidingState(w);
    }
  } else if (w.state === HIDING) {
    w.timer--;
    if (w.timer <= 0) {
      enterBlastState(w);
    }
  } else if (w.state === BLAST) {
    w.x += w.vx;
    w.y += w.vy;
    w.timer--;
    if (w.timer <= 0) {
      w.state = WANDER;
      let maxSpeed = (windowWidth <= mobileBreakpoint) ? mobileWanderSpeed : desktopWanderSpeed;
      w.vx = random(-maxSpeed, maxSpeed);
      w.vy = random(-maxSpeed, maxSpeed);
    }
    keepInBounds(w);
  } else if (w.state === DRAG) {
    // Position handled by mouseDragged
  }
  // Flicker value calculation moved to displayWord using noise
}

function enterHidingState(w) {
  w.state = HIDING;
  w.timer = w.hidingDuration;
  activeHidingWord = w;
  w.x = houseX + houseW / 2;
  w.y = houseY + houseH / 2;
  w.vx = 0;
  w.vy = 0;

  let beamRange = (windowWidth <= mobileBreakpoint) ? mobileBeamCountRange : desktopBeamCountRange;
  w.beamCount = floor(random(beamRange[0], beamRange[1])); // Uses reduced range from constants

  w.beamMinLength = random(width * 0.1, width * 0.4);
  w.beamMaxLength = random(width * 0.3, width * 0.7);
  // --- Make beams thinner ---
  w.beamStrokeMin = random(0.3, 2.0); // Thinner min stroke
  w.beamStrokeMax = random(0.8, 3.0); // Thinner max stroke
  // --- End modification ---
  w.beamHue = random(beamHueMin, beamHueMax); // Use defined hue range
  // --- Reduce saturation ---
  w.beamSat = random(100, 50, 100); // Less saturated beams
  // --- End modification ---
  w.beamBright = random(90, 250);
  // --- Lower alpha slightly ---
  w.beamAlpha = random(50, 80); // Lower max alpha (HSB 0-100 range)
  // --- End modification ---
}

function enterBlastState(w) {
    // --- Trigger Blast Visual Effect ---
    blastX = w.x; // Start blast from word's last position
    blastY = w.y;
    blastRadius = 0; // Start radius at 0
    blastMaxRadius = width * 0.9; // Blast expands to 30% of width (adjust as needed)
    blastAlpha = 255; // Start fully opaque
    // --- End Trigger ---

    w.state = BLAST;
    w.timer = w.blastDuration;
    activeHidingWord = null;

    let speedRange = (windowWidth <= mobileBreakpoint) ? mobileBlastSpeedRange : desktopBlastSpeedRange;
    let speed = random(speedRange[0], speedRange[1]);

    let angle = random(TWO_PI);
    w.vx = speed * cos(angle);
    w.vy = speed * sin(angle);
}

// --- Collision & Bounds ---

function collidesWithHouse(w) {
  textSize(w.size * w.currentScale);
  let tw = textWidth(w.txt);
  let th = w.size * w.currentScale * 0.7;
  let wordLeft = w.x - tw / 2;
  let wordRight = w.x + tw / 2;
  let wordTop = w.y - th / 2;
  let wordBottom = w.y + th / 2;
  let houseLeft = houseX;
  let houseRight = houseX + houseW;
  let houseTop = houseY;
  let houseBottom = houseY + houseH;
  return (wordRight > houseLeft && wordLeft < houseRight && wordBottom > houseTop && wordTop < houseBottom);
}

function keepInBounds(w) {
  textSize(w.size * w.currentScale);
  let tw = textWidth(w.txt);
  let th = w.size * w.currentScale * 0.7;
  let radiusX = tw / 2;
  let radiusY = th / 2;

  if (w.x < radiusX) { w.x = radiusX; w.vx *= -1; }
  if (w.x > width - radiusX) { w.x = width - radiusX; w.vx *= -1; }
  if (w.y < radiusY) { w.y = radiusY; w.vy *= -1; }
  if (w.y > height - radiusY) { w.y = height - radiusY; w.vy *= -1; }
}

// --- Mouse Interactions --- (Unchanged)

function mousePressed() {
  for (let i = wordObjects.length - 1; i >= 0; i--) {
    let w = wordObjects[i];
    if (w.state !== HIDING && w.state !== DRAG) {
      textSize(w.size * w.currentScale);
      let tw = textWidth(w.txt);
      let th = w.size * w.currentScale * 0.7;
      let left = w.x - tw / 2;
      let right = w.x + tw / 2;
      let top = w.y - th / 2;
      let bot = w.y + th / 2;

      if (mouseX > left && mouseX < right && mouseY > top && mouseY < bot) {
        draggedWord = w;
        w.state = DRAG;
        w.targetScale = 3;
        w.vx = 0;
        w.vy = 0;
        break;
      }
    }
  }
}

function mouseDragged() {
  if (draggedWord) {
    textSize(draggedWord.size * draggedWord.currentScale);
    let tw = textWidth(draggedWord.txt);
    let th = draggedWord.size * draggedWord.currentScale * 0.7;
    let radiusX = tw / 2;
    let radiusY = th / 2;
    draggedWord.x = constrain(mouseX, radiusX, width - radiusX);
    draggedWord.y = constrain(mouseY, radiusY, height - radiusY);
  }
}

function mouseReleased() {
  if (draggedWord) {
    if (!activeHidingWord && collidesWithHouse(draggedWord)) {
      enterHidingState(draggedWord);
    } else {
      if (draggedWord.state === DRAG) {
        draggedWord.state = WANDER;
        let maxSpeed = (windowWidth <= mobileBreakpoint) ? mobileWanderSpeed : desktopWanderSpeed;
        draggedWord.vx = random(-maxSpeed, maxSpeed);
        draggedWord.vy = random(-maxSpeed, maxSpeed);
      }
    }
    draggedWord.targetScale = 1.0;
    draggedWord = null;
  }
}

// Optional: Helper function for shuffling array
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}