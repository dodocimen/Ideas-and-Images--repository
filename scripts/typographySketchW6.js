/////////////////////////////
// CONFIGURATION OBJECT
/////////////////////////////
const CONFIG = {
  // Phase 0: Connecting Hats
  phase0: {
    cols: 3,             // number of columns in grid
    rows: 2,             // number of rows in grid
    hatSizeRatio: 0.6,   // multiplier for hat size relative to cell size
    connectDelay: 100,  // ms delay after last hat is activated before transitioning
    floatAmplitude: 15,   // how far hats float up/down
    floatSpeed: 0.05     // speed of floating motion
  },

  // Phase 1: Book + Hats on left
  phase1: {
    cols: 3,
    rows: 2,
    leftWidthRatio: 0.5,  // portion of canvas used for hats on left
    hatSizeRatio: 0.5,    // multiplier for hat size relative to cell size
    floatAmplitude: 5,
    floatSpeed: 0.05,
    bookCoverWidth: 300   // fixed width of the book cover
  },

  // Hover bubble text settings
  bubble: {
    text: "Thinking Hat", // text inside bubble
    fontSize: 10,         // bubble text size
    cornerRadius: 3       // rectangle corner radius
  }
};

/////////////////////////////
// GLOBAL VARIABLES
/////////////////////////////
let hatImage, bookCoverImage;
let hatColors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FF8C33", "#33FFF6"];
let hatsPhase0 = [];
let hatsPhase1 = [];
let activatedSequence = [];

let isDragging = false;
let phase = 0;             // 0 => connect hats, 1 => show book cover & hats on left
let transitionTimer = 0;   // Timer to transition from phase 0 to 1

function preload() {
  // Adjust these paths as needed
  hatImage = loadImage("./img/hat.svg");
  bookCoverImage = loadImage("./img/bookcover.png");
}

function setup() {
  const container = document.getElementById("typography-canvas");
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  let cnv = createCanvas(w, h);
  cnv.parent(container);

  initPhase0Hats();
  initPhase1Hats();
}

function windowResized() {
  const container = document.getElementById("typography-canvas");
  if (!container) return;

  resizeCanvas(container.offsetWidth, container.offsetHeight);

  initPhase0Hats();
  initPhase1Hats();
}

function draw() {
  blendMode(BLEND);

  // Deep blue with low alpha to create subtle trail effect
  fill(3, 0, 191, 20); // ← this is #0300BF with 20 alpha
  noStroke();
  rect(0, 0, width, height);

  if (phase === 0) {
    drawPhase0();
  } else {
    drawPhase1();
  }
}



// ------------------------------------------------------
// PHASE 0: Connect 6 (or any number) Hats
// ------------------------------------------------------
function initPhase0Hats() {
  hatsPhase0 = [];
  activatedSequence = [];
  isDragging = false;
  transitionTimer = 0;

  let cols = CONFIG.phase0.cols;
  let rows = CONFIG.phase0.rows;
  let cellW = width / cols;
  let cellH = height / rows;
  let hatSize = min(cellW, cellH) * CONFIG.phase0.hatSizeRatio;
  let totalHats = cols * rows; // must match length of hatColors if you want each unique

  // Create hats in a grid
  for (let i = 0; i < totalHats; i++) {
    let r = floor(i / cols);
    let c = i % cols;
    let x = cellW / 2 + c * cellW;
    let y = cellH / 2 + r * cellH;
    let colorIndex = i % hatColors.length; // if fewer colors than hats, repeat

    hatsPhase0.push({
      x: x,
      y: y,
      baseX: x,
      baseY: y,
      size: hatSize,
      color: hatColors[colorIndex],
      activated: false,
      floatPhase: random(TWO_PI)
    });
  }
}

function drawPhase0() {
  // Floating + drawing hats
  for (let hat of hatsPhase0) {
    let floatOffset = sin(frameCount * CONFIG.phase0.floatSpeed + hat.floatPhase) 
                      * CONFIG.phase0.floatAmplitude;
    hat.y = hat.baseY + floatOffset;

    // Shimmer on activated hats
    if (hat.activated) {
      let shimmerAlpha = map(
        sin(frameCount * 0.1 + hat.floatPhase),
        -1, 1, 100, 200
      );
      noStroke();
      fill(red(hat.color), green(hat.color), blue(hat.color), shimmerAlpha);
      ellipse(hat.x, hat.y, hat.size * 1.4, hat.size * 1.4);
    }

    // Draw the hat image tinted with color
    push();
    translate(hat.x, hat.y);
    imageMode(CENTER);
    tint(hat.color);
    image(hatImage, 0, 0, hat.size, hat.size);
    pop();
  }

  // Connect lines between activated hats
  stroke(255);
  strokeWeight(4);
  noFill();
  beginShape();
  for (let ah of activatedSequence) {
    vertex(ah.x, ah.y);
  }
  // Extend line to mouse if dragging
  if (isDragging && activatedSequence.length > 0) {
    vertex(mouseX, mouseY);
  }
  endShape();

  // Check if all hats are activated
  let allActivated = hatsPhase0.every(h => h.activated);
  if (allActivated) {
    if (transitionTimer === 0) {
      transitionTimer = millis();
    } else if (millis() - transitionTimer > CONFIG.phase0.connectDelay) {
      phase = 1;
    }
  }
}

// Phase 0 Mouse
function mousePressed() {
  if (phase === 0) {
    for (let hat of hatsPhase0) {
      let d = dist(mouseX, mouseY, hat.x, hat.y);
      if (!hat.activated && d < hat.size / 2) {
        hat.activated = true;
        activatedSequence.push(hat);
        isDragging = true;
        break;
      }
    }
  }
}

function mouseDragged() {
  if (phase === 0 && isDragging) {
    for (let hat of hatsPhase0) {
      let d = dist(mouseX, mouseY, hat.x, hat.y);
      if (!hat.activated && d < hat.size / 2) {
        hat.activated = true;
        activatedSequence.push(hat);
      }
    }
  }
}

function mouseReleased() {
  if (phase === 0) {
    isDragging = false;
  }
}

// ------------------------------------------------------
// PHASE 1: Book on Right, Hats on Left (with Hover Bubbles)
// ------------------------------------------------------
function initPhase1Hats() {
  hatsPhase1 = [];

  let cols = CONFIG.phase1.cols;
  let rows = CONFIG.phase1.rows;
  let leftW = width * CONFIG.phase1.leftWidthRatio;
  let cellW = leftW / cols;
  let cellH = height / rows;
  let hatSize = min(cellW, cellH) * CONFIG.phase1.hatSizeRatio;
  let totalHats = cols * rows;

  for (let i = 0; i < totalHats; i++) {
    let r = floor(i / cols);
    let c = i % cols;
    let x = cellW / 2 + c * cellW;
    let y = cellH / 2 + r * cellH;
    let colorIndex = i % hatColors.length;
    hatsPhase1.push({
      x: x,
      y: y,
      baseX: x,
      baseY: y,
      size: hatSize,
      color: hatColors[colorIndex],
      floatPhase: random(TWO_PI),
      hovered: false
    });
  }
}

function drawPhase1() {
  // Left side: hats in a grid
  for (let hat of hatsPhase1) {
    let floatOffset = sin(frameCount * CONFIG.phase1.floatSpeed + hat.floatPhase) 
                      * CONFIG.phase1.floatAmplitude;
    hat.y = hat.baseY + floatOffset;

    // Check hover
    let d = dist(mouseX, mouseY, hat.x, hat.y);
    hat.hovered = d < hat.size / 2;

    // Draw hat
    push();
    translate(hat.x, hat.y);
    imageMode(CENTER);
    tint(hat.color);
    image(hatImage, 0, 0, hat.size, hat.size);
    pop();

    // If hovered, draw a text bubble
    if (hat.hovered) {
      drawTextBubble(
        hat.x, 
        hat.y - hat.size / 2 - 10,
        CONFIG.bubble.text
      );
    }
  }

  // Right side: show book cover, at a fixed width
  push();
  imageMode(CENTER);
  let coverX = width * 0.75; // center in right half
  let coverY = height / 2;
  let naturalW = bookCoverImage.width;
  let naturalH = bookCoverImage.height;
  
  // We'll scale the book cover to a fixed width from config
  let targetWidth = CONFIG.phase1.bookCoverWidth;
  let scaleFactor = targetWidth / naturalW;
  let targetHeight = naturalH * scaleFactor;
  
  image(bookCoverImage, coverX, coverY, targetWidth, targetHeight);
  pop();
}

// Draw the hover bubble
function drawTextBubble(cx, cy, txt) {
  push();
  textSize(CONFIG.bubble.fontSize);
  let tw = textWidth(txt) + 20;
  let th = CONFIG.bubble.fontSize * 1.4;

  fill(255);
  stroke(0);
  strokeWeight(1);
  rectMode(CENTER);
  rect(cx, cy, tw, th, CONFIG.bubble.cornerRadius);

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  text(txt, cx, cy);
  pop();
}
