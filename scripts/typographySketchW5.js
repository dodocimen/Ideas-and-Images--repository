/*
  wanderingHomesickWords.js
  - Black house in the center
  - Deep blue background (#0300BF)
  - Glowing yellow words with a flicker effect
  - Words wander, hide behind the house (one at a time), then blast out
  - Beams extend freely behind the house
  - **New**: Drag-and-drop words, with smooth scaling effect
  - **New**: Smooth motion trails (background opacity)
  - **New**: Custom font usage
*/

// Word states
const WANDER = 0;
const HIDING = 1;
const BLAST = 2;
const DRAG = 3;

// Only one word can hide at a time
let activeHidingWord = null;
let draggedWord = null;

// Custom font
let customFont;
let container; // <--- ADDED: We'll store a reference to the canvas container

let words = [
  "LONELY", "DISTANT",
  "HOME", "NOSTALGIA", "INSPIRED","SAD","FAMILY","FRIENDS","LOVE","HAPPY","DREAMS","HOPE","PEACE","FAITH","COURAGE","STRENGTH","HEALING","ISOLATION","JOY","LAUGHTER","WANDERING","WISDOM","TRUST","PATIENCE","HONESTY","ACHE","SAFE","ROOTS","COMFORT","GROWTH","RESILIENCE","CURIOSITY","CREATIVITY","LEARNING", "PASSION"
];

let wordObjects = [];

// 1) Preload the custom font
function preload() {
  // Replace './fonts/RoadRage-Regular.ttf' with your actual font path
  customFont = loadFont('./fonts/RoadRage-Regular.ttf');
}

function setup() {
  // Get the container from HTML
  container = document.getElementById("typography-canvas");

  // Measure container
  let w = container.offsetWidth;
  let h = container.offsetHeight;

  // Create and parent the canvas
  let cnv = createCanvas(w, h);
  cnv.parent(container);

  // Use custom font for all text
  textFont(customFont);

  // Initial house dimensions
  houseW = width * 0.10; 
  houseH = height * 0.25;
  houseX = width / 2 - houseW / 2;
  houseY = height / 2 - houseH / 2;

  // Create word objects
  for (let w of words) {
    wordObjects.push(createWordObject(w));
  }
}

// ------------------------------------------------------
// ADDED: Keeps the canvas full-width & properly scaled
function windowResized() {
  if (!container) return;

  // Get new container size
  let w = container.offsetWidth;
  let h = container.offsetHeight;

  // Resize the canvas
  resizeCanvas(w, h);

  // Recalculate house dimensions
  houseW = width * 0.18;
  houseH = height * 0.25;
  houseX = width / 2 - houseW / 2;
  houseY = height / 2 - houseH / 2;

  // NOTE:
  // We do NOT re-randomize words or re-create them,
  // so they stay in their old absolute positions.
}
// ------------------------------------------------------

function draw() {
  // Smooth trail effect using transparency
  background(3, 0, 191, 10);

  if (activeHidingWord) {
    drawUnrestrictedBeams();
  }
  drawHouse();

  for (let w of wordObjects) {
    updateWord(w);
    displayWord(w);
  }
}

// Draw beams using parameters from activeHidingWord
function drawUnrestrictedBeams() {
  if (!activeHidingWord) return;
  push();
  translate(houseX + houseW / 2, houseY + houseH / 2 + 10);

  let beams = activeHidingWord.beamCount;
  for (let i = 0; i < beams; i++) {
    let angle = (TWO_PI / beams) * i + random(-0.1, 0.1); 
    let beamLen = random(activeHidingWord.beamMinLength, activeHidingWord.beamMaxLength);
    let sw = random(activeHidingWord.beamStrokeMin, activeHidingWord.beamStrokeMax);
    strokeWeight(sw);

    colorMode(HSB);
    let a = random(activeHidingWord.beamAlpha - 10, activeHidingWord.beamAlpha + 10);
    stroke(activeHidingWord.beamHue, activeHidingWord.beamSat, activeHidingWord.beamBright, a);
    colorMode(RGB);

    let x2 = cos(angle) * beamLen;
    let y2 = sin(angle) * beamLen;
    line(0, 0, x2, y2);
  }
  pop();
}

// House drawing
function drawHouse() {
  fill("blue");
  noStroke();
  rect(houseX, houseY + 30, houseW, houseH - 30);
  triangle(houseX, houseY + 30, 
           houseX + houseW, houseY + 30,
           houseX + houseW / 2, houseY);
}

// Create a word object
function createWordObject(txt) {
  return {
    txt: txt,
    x: random(width),
    y: random(height),
    vx: random(-1.5, 1.5),
    vy: random(-1.5, 1.5),
    state: WANDER,
    timer: 0,
    hidingDuration: 50,
    blastDuration: 100,
    size: random(20,40),
    flicker: 10,
    currentScale: 1.0, 
    targetScale: 1.0,
    originalVX: 0,
    originalVY: 0
  };
}

// Update word
function updateWord(w) {
  w.currentScale = lerp(w.currentScale, w.targetScale, 0.15);

  if (w.state === WANDER) {
    w.x += w.vx;
    w.y += w.vy;
    keepInBounds(w);

    if (!activeHidingWord && w.state !== DRAG && collidesWithHouse(w)) {
      enterHidingState(w);
    }
  }
  else if (w.state === HIDING) {
    w.timer--;
    if (w.timer <= 0) {
      enterBlastState(w);
    }
  }
  else if (w.state === BLAST) {
    w.x += w.vx;
    w.y += w.vy;
    w.timer--;
    if (w.timer <= 0) {
      w.state = WANDER;
      w.vx = random(-1.5, 1.5);
      w.vy = random(-1.5, 1.5);
    }
    keepInBounds(w);
  }
  else if (w.state === DRAG) {
    // Dragging handled in mouseDragged()
  }

  w.flicker = 0.9 + random(0.2);
}

// Enter hiding
function enterHidingState(w) {
  w.state = HIDING;
  w.timer = w.hidingDuration;
  activeHidingWord = w;
  w.x = houseX + houseW / 2;
  w.y = houseY + houseH / 2 + 10;
  w.vx = 0;
  w.vy = 0;

  // Switch to HSB mode for vibrant neon colors
  colorMode(HSB);

  // Randomize beam parameters for this hiding event
  w.beamCount = floor(random(10, 201));
  w.beamMinLength = random(50, 300);
  w.beamMaxLength = random(200, 300);
  w.beamStrokeMin = random(0.5, 3);
  w.beamStrokeMax = random(0.5, 6);
  w.beamHue = random(10, 260);
  w.beamSat = random(10, 100);
  w.beamBright = random(150, 250);
  w.beamAlpha = random(250, 250);

  // Reset color mode to RGB
  colorMode(RGB);
}

// Enter blast
function enterBlastState(w) {
  w.state = BLAST;
  w.timer = w.blastDuration;
  activeHidingWord = null;
  let angle = random(TWO_PI);
  let speed = random(4, 6);
  w.vx = speed * cos(angle);
  w.vy = speed * sin(angle);
}

// Collision with house
function collidesWithHouse(w) {
  let tw = textWidth(w.txt) * w.currentScale;
  let th = w.size * w.currentScale;
  let left = w.x - tw / 2;
  let right= w.x + tw / 2;
  let top  = w.y - th / 2;
  let bot  = w.y + th / 2;

  let houseLeft = houseX;
  let houseRight= houseX + houseW;
  let houseTop  = houseY;
  let houseBot  = houseY + houseH;

  return !(right < houseLeft || left > houseRight || bot < houseTop || top > houseBot);
}

function keepInBounds(w) {
  let r = (w.size * w.currentScale) / 2;
  if (w.x < r) {
    w.x = r; w.vx *= -1;
  }
  if (w.x > width - r) {
    w.x = width - r; w.vx *= -1;
  }
  if (w.y < r) {
    w.y = r; w.vy *= -1;
  }
  if (w.y > height - r) {
    w.y = height - r; w.vy *= -1;
  }
}

// Display word
function displayWord(w) {
  push();
  translate(w.x, w.y);
  textAlign(CENTER, CENTER);
  let scaleVal = w.currentScale; 
  textSize(w.size * scaleVal);

  let baseColor = color(255, 255, 0);
  let alphaVal = 200 * w.flicker;
  baseColor.setAlpha(alphaVal);
  fill(baseColor);

  text(w.txt, 0, 0);
  pop();
}

// ============ MOUSE INTERACTIONS ============ //

function mousePressed() {
  for (let i = wordObjects.length - 1; i >= 0; i--) {
    let w = wordObjects[i];
    if (w.state === WANDER || w.state === BLAST) {
      let tw = textWidth(w.txt) * w.currentScale;
      let th = w.size * w.currentScale;
      let left = w.x - tw/2;
      let right = w.x + tw/2;
      let top = w.y - th/2;
      let bot = w.y + th/2;

      if (mouseX > left && mouseX < right && mouseY > top && mouseY < bot) {
        draggedWord = w;
        w.state = DRAG;
        w.targetScale = 2;
        w.originalVX = w.vx;
        w.originalVY = w.vy;
        w.vx = 0;
        w.vy = 0;
        break;
      }
    }
  }
}

function mouseDragged() {
  if (draggedWord) {
    draggedWord.x = mouseX;
    draggedWord.y = mouseY;
  }
}

function mouseReleased() {
  if (draggedWord) {
    if (!activeHidingWord && collidesWithHouse(draggedWord)) {
      enterHidingState(draggedWord);
    } else {
      if (draggedWord.state === DRAG) {
        draggedWord.state = WANDER;
        draggedWord.vx = random(-1.5, 1.5);
        draggedWord.vy = random(-1.5, 1.5);
      }
    }
    draggedWord.targetScale = 1.0;
    draggedWord = null;
  }
}
