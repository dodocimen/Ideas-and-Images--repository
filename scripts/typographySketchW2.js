// Responsive p5 sketch: typographySketchW2.js
// Full words now appear in order instead of randomly.
// The canvas will dynamically adapt to the container's size.

let fonts = [];         // Array to hold custom fonts
let letters = [];       // Array to hold Letter and FullWord objects

// Full words (in sequence, NOT random)
const FULL_WORDS = ["MASCULINE", "JUDGEMENT", "PRIDE", "EGO", "TOXIC"];
let fullWordIndex = 0;  // Track the next word in sequence

// Single characters for Letter objects
const SINGLE_CHARS = ["A", "B", "C", "D", "E", "X", "Y", "Z", "!", "?"];

// To check if the user is pressing inside the canvas
let isPressingOnCanvas = false;

// To track red/black toggle
let lastColorSwitch = -1;
let hasSpawnedFullWord = false; // Becomes true once we spawn a full word

// -------------------------
// Preload function: Load custom fonts before the sketch starts
// -------------------------
function preload() {
  // Adjust the font file paths as needed
  fonts[0] = loadFont("./fonts/Boldonse-Regular.ttf");
  fonts[1] = loadFont("./fonts/Oswald-Regular.ttf");
  fonts[2] = loadFont("./fonts/Roboto-Regular.ttf");
}

// -------------------------
// Setup function: Create the canvas based on the container's size
// -------------------------
function setup() {
  // Get the container element where the canvas will reside
  const container = document.getElementById("typography-canvas");
  // Use the container's width and height for the canvas dimensions
  const w = container.offsetWidth;
  const h = container.offsetHeight;

  // Create the canvas with dynamic dimensions and parent it to the container
  const canvas = createCanvas(w, h);
  canvas.parent("typography-canvas");

  // Set angle mode and text alignment for consistency
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
}

// -------------------------
// Draw function: Main loop to update and display letters/full words
// -------------------------
function draw() {
  // Check if the mouse is inside the canvas boundaries
  let insideCanvas = (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height);
  isPressingOnCanvas = (mouseIsPressed && insideCanvas);

  // When the mouse is not pressing, clear the background and reset full word flag
  if (!isPressingOnCanvas) {
    background("#0300BF");
    hasSpawnedFullWord = false; 
  } else {
    // Toggle background between red and black every 5 frames
    let colorSwitch = floor(frameCount / 5) % 2;
    
    if (colorSwitch === 0) {
      background("red");
      // If just switched to red and haven't spawned a full word yet, do so
      if (lastColorSwitch !== 0) {
        spawnFullWord();
        hasSpawnedFullWord = true;
      }
    } else {
      background("black");
      // Reset the full word flag so a new one can be spawned next time
      hasSpawnedFullWord = false;
    }
    lastColorSwitch = colorSwitch;
  }

  // 1) When the mouse moves (and not pressing), spawn normal letters at the current position
  if ((mouseX !== pmouseX || mouseY !== pmouseY) && !isPressingOnCanvas) {
    letters.push(new Letter(mouseX, mouseY, 24, false));
  }

  // 2) While pressing on the canvas, spawn letters with faster velocity
  if (isPressingOnCanvas) {
    // Create two letters per frame when the mouse is pressed
    for (let i = 0; i < 2; i++) {
      letters.push(new Letter(mouseX, mouseY, 20, true));
    }
  }

  // Update and display each letter or full word
  for (let i = letters.length - 1; i >= 0; i--) {
    letters[i].update();
    letters[i].display();
    // Remove objects that have moved off the screen
    if (letters[i].offScreen()) {
      letters.splice(i, 1);
    }
  }
}

// -------------------------
// Function to spawn the next full word from the sequence
// -------------------------
function spawnFullWord() {
  // Create a new FullWord object at the mouse position using the next word
  letters.push(new FullWord(mouseX, mouseY, FULL_WORDS[fullWordIndex]));

  // Update the index to cycle through the full words array
  fullWordIndex = (fullWordIndex + 1) % FULL_WORDS.length;
}

// -------------------------
// windowResized function: Called automatically when the window is resized.
// It ensures that the canvas adapts to its container's new dimensions.
// -------------------------
function windowResized() {
  const container = document.getElementById("typography-canvas");
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  resizeCanvas(w, h);
}

// -------------------------
// Class: Letter
// Represents single letters that appear when the mouse moves or is pressed.
// -------------------------
class Letter {
  constructor(x, y, size, isFast) {
    this.x = x;
    this.y = y;
    // Randomly select a font from the loaded fonts
    this.font = random(fonts);
    // Choose a random character from SINGLE_CHARS
    this.char = random(SINGLE_CHARS);

    this.size = size;
    this.defaultClr = color("#D9D9D9");

    // Set velocity ranges based on whether a faster movement is desired
    if (isFast) {
      // Higher velocity for fast movement (when pressing)
      this.vx = random(-4, 4);
      this.vy = random(-8, -3);
    } else {
      // Normal velocity for normal movement
      this.vx = random(-2, 2);
      this.vy = random(-4, -1);
    }
  }

  // Update the letter's position based on its velocity
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  // Display the letter using the selected font, size, and color
  display() {
    push();
    textFont(this.font);
    textSize(this.size);

    // If the mouse is pressing, use pink; otherwise, use the default color
    if (isPressingOnCanvas) {
      fill("pink");
    } else {
      fill(this.defaultClr);
    }
    text(this.char, this.x, this.y);
    pop();
  }

  // Check if the letter has moved off the screen (canvas)
  offScreen() {
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }
}

// -------------------------
// Class: FullWord
// Represents full words that appear during the red phase.
// -------------------------
class FullWord {
  constructor(x, y, word) {
    this.x = x;
    this.y = y;
    // Use a fixed font for full words
    this.font = fonts[0];
    this.word = word;  // The full word text from the sequence

    // Set a normal velocity for full words
    this.vx = random(-2, 2);
    this.vy = random(-4, -1);

    this.size = 32;
    this.defaultClr = color("#0300BF");
  }

  // Update the full word's position based on its velocity
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  // Display the full word with the correct font, size, and color
  display() {
    push();
    textFont(this.font);
    textSize(this.size);

    // Use black when pressing; otherwise, use the default background color (#0300BF)
    if (isPressingOnCanvas) {
      fill("black");
    } else {
      fill(this.defaultClr);
    }
    text(this.word, this.x, this.y);
    pop();
  }

  // Check if the full word has moved off the screen (canvas)
  offScreen() {
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }
}
