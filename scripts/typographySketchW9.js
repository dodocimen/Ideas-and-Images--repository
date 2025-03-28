/**************************************************************
 * Kinetic Typography - "Copy, Break, Rebuild" with Tile Warp (Optimized & Custom Local Fonts)
 * 
 * This sketch demonstrates:
 * 1. Aligned: Letters move together to form a word.
 * 2. Drifting: Letters break apart using Perlin noise.
 * 3. Transition via mousePress: Clicking cycles to a new word.
 *
 * Customizable aspects include:
 *  - Local custom fonts (each letter randomly selects one from a loaded list)
 *  - Text & background colors
 *  - Text size, letter spacing, movement speeds, etc.
 *  - A gentle attraction effect when the cursor nears a letter.
 *  - A tile-warp effect that copies an offscreen buffer in tiles with a slight sinusoidal warp.
 *
 * The main canvas is attached to a container <div> with the ID "typography-canvas".
 **************************************************************/

// Global configuration for customization.
const config = {
  canvasWidth: 750,
  canvasHeight: 400,
  textSize: 120,
  letterSpacing: 60,
  alignDuration: 1000,       // How long letters stay aligned (ms)
  bgColor: "#1E1E1E",        // Background color
  textColors: ["#EBEBEB", "#FFC300", "#FF845D"],
  // The fontList will be replaced by local fonts in preload()
  fontList: [],
  lerpSpeed: 0.5,
  noiseIncrement: 0.01,
  noiseRange: 2,
  attractionThreshold: 100,  // Pixels for cursor attraction
  attractionStrength: 0.05,  // Fraction of distance per frame
  // Tile effect settings:
  tilesX: 6,  // Reduced tile count for performance
  tilesY: 6,
  maxWarp: 20               // Maximum warp displacement in pixels
};

// Declare font variables for local fonts.
let oswaldFont, robotoFont, latoFont, montserratFont;

// Array of words to cycle through.
let words = ["COPY", "BREAK", "REBUILD", "CREATE", "EVOLVE"];
let currentWordIndex = 0;
let letters = [];    // Array to hold Letter objects.
let phase = "aligned";  // "aligned" or "drifting"
let alignStartTime;     // Time when letters finished aligning.

// Offscreen buffer for the tile-warp effect.
let pg;

function preload() {
  // Load local fonts (adjust paths if needed)
  oswaldFont = loadFont("./fonts/AmericanTypewriter-Regular.ttf");
  robotoFont = loadFont("./fonts/BrokenDetroit-Regular.ttf");
  latoFont = loadFont("./fonts/Boldonse-Regular.ttf");
  montserratFont = loadFont("./fonts/RoadRage-Regular.ttf");

  // Replace the fontList in config with these local fonts.
  config.fontList = [oswaldFont, robotoFont, latoFont, montserratFont];
}

function setup() {
  // Optimize performance: Set pixel density and disable smoothing.
  pixelDensity(2);
  noSmooth();

  // Create the main canvas and attach it to the container.
  let myCanvas = createCanvas(config.canvasWidth, config.canvasHeight);
  myCanvas.parent("typography-canvas");

  // Set text properties for the main canvas.
  textSize(config.textSize);
  textAlign(CENTER, CENTER);

  // Create an offscreen graphics buffer (same size as main canvas).
  pg = createGraphics(width, height);
  pg.noSmooth();
  pg.textSize(config.textSize);
  pg.textAlign(CENTER, CENTER);

  // Initialize letters for the first word.
  createLetters(words[currentWordIndex]);
  alignStartTime = millis();
}

function draw() {
  // Clear main canvas background.
  background(config.bgColor);

  // Update kinetic typography state.
  if (phase === "aligned") {
    for (let letter of letters) {
      letter.updateAligned();
    }
    if (millis() - alignStartTime > config.alignDuration) {
      phase = "drifting";
    }
  } else if (phase === "drifting") {
    for (let letter of letters) {
      letter.updateDrifting();
    }
  }

  // Attraction effect: gently pull letters toward the cursor if nearby.
  for (let letter of letters) {
    let d = dist(mouseX, mouseY, letter.x, letter.y);
    if (d < config.attractionThreshold) {
      letter.x += (mouseX - letter.x) * config.attractionStrength;
      letter.y += (mouseY - letter.y) * config.attractionStrength;
    }
  }

  // Draw the kinetic typography onto the offscreen buffer.
  pg.clear();
  pg.background(config.bgColor);
  for (let letter of letters) {
    letter.display(pg);
  }

  // ----- Tile-Warp Effect: Copy tiles from pg to main canvas -----
  let t = millis() * 0.001; // time variable for smooth animation
  let tileW = width / config.tilesX;
  let tileH = height / config.tilesY;
  let iTileW = floor(tileW);
  let iTileH = floor(tileH);

  // Compute a warp factor (oscillates from 0 to maxWarp).
  let warpFactor = map(sin(t), -1, 1, 0, config.maxWarp, true);

  // Iterate over each tile and copy with a slight warp offset.
  for (let ty = 0; ty < config.tilesY; ty++) {
    for (let tx = 0; tx < config.tilesX; tx++) {
      let waveBase1 = (tx + ty + t) * 0.5;
      let waveBase2 = (tx - ty - t) * 0.5;
      let waveX = sin(waveBase1) * warpFactor;
      let waveY = cos(waveBase2) * warpFactor;
      let sx = floor(tx * tileW + waveX);
      let sy = floor(ty * tileH + waveY);
      let dx = floor(tx * tileW);
      let dy = floor(ty * tileH);
      copy(pg, sx, sy, iTileW, iTileH, dx, dy, iTileW, iTileH);
    }
  }
}

// Mouse press: if in drifting phase, cycle to the next word.
function mousePressed() {
  if (phase === "drifting") {
    currentWordIndex = (currentWordIndex + 1) % words.length;
    createLettersFromCurrent(words[currentWordIndex]);
    phase = "aligned";
    alignStartTime = millis();
  }
}

// Create letters for a given word, centered on the canvas.
function createLetters(word) {
  letters = [];
  let spacing = config.letterSpacing;
  let startX = width / 2 - ((word.length - 1) * spacing) / 2;
  for (let i = 0; i < word.length; i++) {
    let char = word.charAt(i);
    let x = startX + i * spacing;
    let y = height / 2;
    letters.push(new Letter(char, x, y));
  }
}

// Transition to a new word, preserving drifting positions where possible.
function createLettersFromCurrent(word) {
  let newLetters = [];
  let spacing = config.letterSpacing;
  let startX = width / 2 - ((word.length - 1) * spacing) / 2;
  for (let i = 0; i < word.length; i++) {
    let char = word.charAt(i);
    let alignedX = startX + i * spacing;
    let alignedY = height / 2;
    let x, y;
    if (i < letters.length) {
      x = letters[i].x;
      y = letters[i].y;
    } else {
      x = width / 2;
      y = height / 2;
    }
    newLetters.push(new Letter(char, alignedX, alignedY, x, y));
  }
  letters = newLetters;
}

// Class for individual letters.
class Letter {
  constructor(letter, alignedX, alignedY, x, y) {
    this.letter = letter;
    this.alignedX = alignedX;
    this.alignedY = alignedY;
    this.x = (x !== undefined) ? x : alignedX;
    this.y = (y !== undefined) ? y : alignedY;
    // Randomly choose a local custom font and text color.
    this.font = random(config.fontList);
    this.textColor = random(config.textColors);
    // Noise offsets for drifting.
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000);
  }

  updateAligned() {
    this.x = lerp(this.x, this.alignedX, config.lerpSpeed);
    this.y = lerp(this.y, this.alignedY, config.lerpSpeed);
  }

  updateDrifting() {
    let driftX = map(noise(this.noiseOffsetX), 0, 1, -config.noiseRange, config.noiseRange);
    let driftY = map(noise(this.noiseOffsetY), 0, 1, -config.noiseRange, config.noiseRange);
    this.x += driftX;
    this.y += driftY;
    this.noiseOffsetX += config.noiseIncrement;
    this.noiseOffsetY += config.noiseIncrement;
  }

  // Draw the letter onto a given graphics buffer.
  display(buffer) {
    buffer.push();
    buffer.textFont(this.font);
    buffer.fill(this.textColor);
    buffer.text(this.letter, this.x, this.y);
    buffer.pop();
  }
}
