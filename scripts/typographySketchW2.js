// typographySketchW2.js
// Full words now appear in order instead of randomly.

let fonts = [];
let letters = [];

// Full words (in sequence, NOT random)
const FULL_WORDS = ["MASCULINE", "JUDGEMENT", "PRIDE", "EGO", "TOXIC"];
let fullWordIndex = 0; // Track the next word in sequence

// Single characters
const SINGLE_CHARS = ["A", "B", "C", "D", "E", "X", "Y", "Z", "!", "?"];

// We'll check if user is pressing inside the canvas
let isPressingOnCanvas = false;

// To track red/black toggle
let lastColorSwitch = -1;
let hasSpawnedFullWord = false; // Becomes true once we spawn in the red phase

function preload() {
  fonts[0] = loadFont("./fonts/Boldonse-Regular.ttf");
  fonts[1] = loadFont("./fonts/Oswald-Regular.ttf");
  fonts[2] = loadFont("./fonts/Roboto-Regular.ttf");
}

function setup() {
  const container = document.getElementById("typography-canvas");
  const w = container.offsetWidth;
  const h = container.offsetHeight;

  const canvas = createCanvas(w, h);
  canvas.parent("typography-canvas");

  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
}

function draw() {
  // Check if mouse is inside the canvas
  let insideCanvas = (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height);
  isPressingOnCanvas = (mouseIsPressed && insideCanvas);

  // If not pressing, background = #0300BF, reset hasSpawnedFullWord
  if (!isPressingOnCanvas) {
    background("#0300BF");
    hasSpawnedFullWord = false; 
  } else {
    // Toggling red/black every 10 frames
    let colorSwitch = floor(frameCount / 5) % 2;

    if (colorSwitch === 0) {
      background("red");
      // If we just switched to red and haven't spawned yet, spawn exactly one full word
      if (lastColorSwitch !== 0) {
        spawnFullWord();
        hasSpawnedFullWord = true;
      }
    } else {
      background("black");
      // If it's black, we can reset the single-word limit for the next red
      hasSpawnedFullWord = false;
    }
    lastColorSwitch = colorSwitch;
  }

  // 1) If mouse moved (and not pressing on canvas) => spawn normal letters
  if ((mouseX !== pmouseX || mouseY !== pmouseY) && !isPressingOnCanvas) {
    letters.push(new Letter(mouseX, mouseY, 24, false));
  }

  // 2) While pressing on canvas => letters have bigger velocity
  if (isPressingOnCanvas) {
    // Two smaller letters each frame (faster velocity)
    for (let i = 0; i < 2; i++) {
      letters.push(new Letter(mouseX, mouseY, 20, true));
    }
  }

  // Update and display all floating objects
  for (let i = letters.length - 1; i >= 0; i--) {
    letters[i].update();
    letters[i].display();
    if (letters[i].offScreen()) {
      letters.splice(i, 1);
    }
  }
}

function spawnFullWord() {
  // Spawn the next word in sequence
  letters.push(new FullWord(mouseX, mouseY, FULL_WORDS[fullWordIndex]));

  // Move to the next word in order, looping back to 0 after last word
  fullWordIndex = (fullWordIndex + 1) % FULL_WORDS.length;
}

function windowResized() {
  const container = document.getElementById("typography-canvas");
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  resizeCanvas(w, h);
}

// -------------------------
// Class: Letter
// -------------------------
class Letter {
  constructor(x, y, size, isFast) {
    this.x = x;
    this.y = y;
    this.font = random(fonts);
    this.char = random(SINGLE_CHARS);

    this.size = size;
    this.defaultClr = color("#D9D9D9");

    if (isFast) {
      // Larger velocity range
      this.vx = random(-4, 4);
      this.vy = random(-8, -3);
    } else {
      // Normal velocity
      this.vx = random(-2, 2);
      this.vy = random(-4, -1);
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    push();
    textFont(this.font);
    textSize(this.size);

    if (isPressingOnCanvas) {
      fill("pink");
    } else {
      fill(this.defaultClr);
    }

    text(this.char, this.x, this.y);
    pop();
  }

  offScreen() {
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }
}

// -------------------------
// Class: FullWord
// -------------------------
class FullWord {
  constructor(x, y, word) {
    this.x = x;
    this.y = y;
    this.font = fonts[0]; // Fixed font
    this.word = word; // Use word from sequence

    // Normal velocity
    this.vx = random(-2, 2);
    this.vy = random(-4, -1);

    this.size = 32;
    this.defaultClr = color("#0300BF");
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    push();
    textFont(this.font);
    textSize(this.size);

    // If pressing => black, else default (#0300BF)
    if (isPressingOnCanvas) {
      fill("black");
    } else {
      fill(this.defaultClr);
    }

    text(this.word, this.x, this.y);
    pop();
  }

  offScreen() {
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }
}
