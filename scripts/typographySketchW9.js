/**************************************************************
 * Kinetic Typography - "Copy, Break, Rebuild" with Tile Warp (Optimized & Custom Local Fonts)
 * REFACTORED VERSION
 *
 * This sketch demonstrates kinetic typography effects:
 * 1. Aligned: Letters smoothly move to form a target word.
 * 2. Drifting: Letters break apart and drift using Perlin noise.
 * 3. Transition: Clicking the mouse cycles through a list of words.
 * 4. Attraction: Letters are gently pulled towards the cursor when nearby.
 * 5. Tile Warp: The final visual is rendered using a tile-based warping effect
 * applied to an offscreen buffer containing the letter drawings.
 *
 * It uses local custom fonts, allows color/timing customization via 'config',
 * and responsively adapts to the size of its container div.
 **************************************************************/

// --- Configuration Object ---
// Centralized settings for easy customization.
const config = {
  // Note: canvasWidth/Height are defaults; overridden by container size in setup.
  canvasWidth: 750,         // Default canvas width
  canvasHeight: 400,        // Default canvas height
  textSize: 110,            // Base text size
  letterSpacing: 60,        // Horizontal spacing between letters
  alignDuration: 1000,      // How long letters stay aligned (ms)
  bgColor: "#1E1E1E",       // Background color of the canvas
  textColors: ["#EBEBEB", "#FFC300", "#FF845D"], // Possible letter colors (randomly chosen)
  fontList: [],             // Will be populated with loaded p5.Font objects in preload()
  lerpSpeed: 0.1,           // Speed for letters moving to aligned position (0 to 1)
  noiseIncrement: 0.01,     // How fast Perlin noise evolves for drifting
  noiseRange: 2,            // Max distance letters drift per frame based on noise
  attractionThreshold: 100, // Distance (pixels) within which cursor attracts letters
  attractionStrength: 0.05, // How strongly letters are pulled towards cursor (fraction per frame)
  // Tile-warp effect settings:
  tilesX: 6,                // Number of tiles horizontally (lower improves performance)
  tilesY: 6,                // Number of tiles vertically
  maxWarp: 20               // Maximum pixel displacement for the warp effect
};

// --- Constants for Tile Warp Calculations ---
const TIME_MULTIPLIER = 0.001; // Convert millis() to seconds for smoother animation timing
const WAVE_MULTIPLIER_1 = 0.5; // Factor for first wave calculation
const WAVE_MULTIPLIER_2 = 0.5; // Factor for second wave calculation

// --- Font Variables ---
// To hold the p5.Font objects loaded from local files.
let oswaldFont, robotoFont, latoFont, montserratFont;

// --- Word List & State ---
const words = ["COPY", "BREAK", "REBUILD", "CREATE", "EVOLVE"]; // Words to cycle through
let currentWordIndex = 0; // Index of the currently displayed word in the 'words' array
let letters = [];         // Array to hold Letter objects for the current word.
let phase = "aligned";    // Current state: "aligned" or "drifting"
let alignStartTime;       // Timestamp (millis) when letters finished aligning.

// --- Graphics Buffer ---
let pg; // p5.Graphics object (offscreen buffer) for drawing letters before warp effect.


//==================================================
// P5.js Core Functions: preload, setup, draw
//==================================================

/**
 * Load assets like fonts before the sketch starts.
 */
function preload() {
  // Load local fonts from specified paths. Ensure these paths are correct relative to your HTML file.
  // NOTE: Font loading issues are common; check paths and browser console if fonts don't appear.
  try {
    oswaldFont = loadFont("./fonts/AmericanTypewriter-Regular.ttf");
    robotoFont = loadFont("./fonts/BrokenDetroit-Regular.ttf");
    latoFont = loadFont("./fonts/Boldonse-Regular.ttf");
    montserratFont = loadFont("./fonts/RoadRage-Regular.ttf");

    // Populate the font list in the config object with the loaded fonts.
    config.fontList = [oswaldFont, robotoFont, latoFont, montserratFont];
    console.log("Fonts loaded successfully.");
  } catch (error) {
    console.error("Error loading fonts:", error);
    // Provide fallback fonts if loading fails?
    config.fontList = ["sans-serif"]; // Use browser default as fallback
  }
}

/**
 * Initial setup: create canvas, graphics buffer, initialize letters. Runs once.
 */
function setup() {
  // --- Responsive Canvas Setup ---
  // Find the container div in the HTML.
  let container = document.getElementById("typography-canvas");
  if (!container) {
      console.error("Container element '#typography-canvas' not found! Creating default canvas.");
      // Create a default sized canvas if the container is missing.
      createCanvas(config.canvasWidth, config.canvasHeight);
  } else {
      // Create the canvas matching the container's dimensions.
      let w = container.offsetWidth;
      let h = container.offsetHeight;
      let myCanvas = createCanvas(w, h);
      myCanvas.parent("typography-canvas"); // Attach the canvas to the container div.
      console.log(`Canvas created with container size: ${w}x${h}`);
  }

  // --- Main Canvas Settings ---
  // Set default text properties (can be overridden by Letter class).
  textSize(config.textSize);
  textAlign(CENTER, CENTER); // Align text centrally.

  // --- Offscreen Buffer Setup ---
  // Create a graphics buffer with the same dimensions as the main canvas.
  // Letters will be drawn here first.
  pg = createGraphics(width, height);
  pg.noSmooth(); // Optional: disable smoothing for sharper pixels in buffer
  pg.textSize(config.textSize); // Match main canvas text size
  pg.textAlign(CENTER, CENTER); // Match main canvas alignment

  // --- Initialize Game State ---
  // Create Letter objects for the first word in the list.
  createLetters(words[currentWordIndex]);
  // Record the time when the sketch starts (letters begin aligned).
  alignStartTime = millis();

  console.log("Setup complete. Initial word:", words[currentWordIndex]);
}

/**
 * Main drawing loop: updates state, draws letters to buffer, applies warp effect. Runs continuously.
 */
function draw() {
  // --- Clear Main Canvas ---
  background(config.bgColor);

  // --- Update Letter States ---
  // Update each letter based on the current phase ("aligned" or "drifting").
  if (phase === "aligned") {
    // Move letters towards their target positions.
    for (let letter of letters) {
      letter.updateAligned();
    }
    // Check if the alignment duration has passed.
    if (millis() - alignStartTime > config.alignDuration) {
      console.log("Phase changing to: drifting");
      phase = "drifting"; // Switch to drifting phase.
    }
  } else if (phase === "drifting") {
    // Move letters based on Perlin noise.
    for (let letter of letters) {
      letter.updateDrifting();
    }
  }

  // --- Apply Cursor Attraction ---
  // Gently pull letters towards the cursor if it's close enough.
  for (let letter of letters) {
    let d = dist(mouseX, mouseY, letter.x, letter.y); // Distance from letter to mouse
    if (d < config.attractionThreshold) {
      // Move letter towards mouse using lerp-like calculation
      letter.x += (mouseX - letter.x) * config.attractionStrength;
      letter.y += (mouseY - letter.y) * config.attractionStrength;
    }
  }

  // --- Draw Letters to Offscreen Buffer ---
  pg.clear(); // Clear previous frame from buffer
  pg.background(config.bgColor); // Set buffer background
  // Draw each letter onto the buffer using its display method.
  for (let letter of letters) {
    letter.display(pg);
  }

  // --- Apply Tile-Warp Effect ---
  // Copy tiles from the offscreen buffer (pg) to the main canvas with warp.
  applyTileWarpEffect(pg);
}


//==================================================
// Interaction & State Management
//==================================================

/**
 * Handles mouse press events: transitions to the next word if currently drifting.
 */
function mousePressed() {
  // Only transition if the letters are currently in the "drifting" phase.
  if (phase === "drifting") {
    console.log("Mouse pressed during drifting phase. Transitioning word.");
    // Cycle to the next word index, wrapping around using modulo.
    currentWordIndex = (currentWordIndex + 1) % words.length;
    // Create new Letter objects for the new word, trying to inherit old positions.
    createLettersFromCurrent(words[currentWordIndex]);
    // Switch back to the "aligned" phase.
    phase = "aligned";
    // Reset the alignment start time.
    alignStartTime = millis();
  } else {
      console.log("Mouse pressed during aligned phase. No action.");
  }
}

/**
 * Creates Letter objects for a given word, positioning them centrally.
 * Used for the initial word setup.
 * @param {string} word - The word to create letters for.
 */
function createLetters(word) {
  letters = []; // Clear the existing letters array.
  let totalWidth = (word.length - 1) * config.letterSpacing; // Calculate total width based on spacing.
  let startX = width / 2 - totalWidth / 2; // Calculate starting X for centering.

  // Create a Letter object for each character in the word.
  for (let i = 0; i < word.length; i++) {
    let char = word.charAt(i);
    let targetX = startX + i * config.letterSpacing; // Calculate target X position.
    let targetY = height / 2; // Target Y position is canvas center.
    // Create new letter at its aligned position.
    letters.push(new Letter(char, targetX, targetY));
  }
  console.log(`Created letters for word: "${word}"`);
}

/**
 * Transitions to a new word, creating new Letter objects.
 * It attempts to start new letters from the position of corresponding old letters
 * for a smoother visual transition when possible.
 * @param {string} word - The new word to display.
 */
function createLettersFromCurrent(word) {
  let newLetters = []; // Array for the new set of letters.
  let totalWidth = (word.length - 1) * config.letterSpacing; // Calculate width for centering.
  let startX = width / 2 - totalWidth / 2; // Calculate starting X.

  // Iterate through the characters of the new word.
  for (let i = 0; i < word.length; i++) {
    let char = word.charAt(i);
    let targetX = startX + i * config.letterSpacing; // New target X position.
    let targetY = height / 2; // New target Y position.
    let initialX, initialY;

    // If there's an existing letter at this index, use its current position as the starting point.
    if (i < letters.length) {
      initialX = letters[i].x;
      initialY = letters[i].y;
    } else {
      // If the new word is longer, start new letters from the center or a random nearby position.
      initialX = width / 2 + random(-config.letterSpacing, config.letterSpacing);
      initialY = height / 2 + random(-config.letterSpacing, config.letterSpacing);
    }
    // Create the new Letter object with target (aligned) and initial (current) positions.
    newLetters.push(new Letter(char, targetX, targetY, initialX, initialY));
  }
  // Replace the old letters array with the new one.
  letters = newLetters;
  console.log(`Transitioned letters to word: "${word}"`);
}


/**
 * Applies the tile-warp effect by copying sections from the source buffer
 * to the main canvas with calculated offsets.
 * @param {p5.Graphics} sourceBuffer - The offscreen buffer containing the content to warp.
 */
function applyTileWarpEffect(sourceBuffer) {
  // Calculate time in seconds for smooth animation patterns.
  let timeSeconds = millis() * TIME_MULTIPLIER;

  // Calculate the width and height of each tile.
  let tileW = width / config.tilesX;
  let tileH = height / config.tilesY;
  // Use integer dimensions for the copy operation to avoid potential artifacts.
  let iTileW = floor(tileW);
  let iTileH = floor(tileH);

  // Calculate a warp amplitude that oscillates smoothly over time (0 to maxWarp).
  let warpAmplitude = map(sin(timeSeconds), -1, 1, 0, config.maxWarp, true);

  // Iterate through each tile position (tx, ty).
  for (let ty = 0; ty < config.tilesY; ty++) {
    for (let tx = 0; tx < config.tilesX; tx++) {
      // Calculate wave patterns based on tile position and time.
      // These create shifting sinusoidal offsets.
      let waveBase1 = (tx + ty + timeSeconds) * WAVE_MULTIPLIER_1;
      let waveBase2 = (tx - ty - timeSeconds) * WAVE_MULTIPLIER_2;
      let waveOffsetX = sin(waveBase1) * warpAmplitude; // Horizontal offset
      let waveOffsetY = cos(waveBase2) * warpAmplitude; // Vertical offset

      // Calculate source coordinates (sx, sy) in the buffer, applying the warp offset.
      // Use floor to get integer coordinates.
      let sx = floor(tx * tileW + waveOffsetX);
      let sy = floor(ty * tileH + waveOffsetY);

      // Calculate destination coordinates (dx, dy) on the main canvas (no offset).
      let dx = floor(tx * tileW);
      let dy = floor(ty * tileH);

      // Copy the tile from the calculated source region (sx, sy) in the buffer
      // to the destination region (dx, dy) on the main canvas.
      // Use integer tile dimensions (iTileW, iTileH).
      copy(sourceBuffer, sx, sy, iTileW, iTileH, dx, dy, iTileW, iTileH);
    }
  }
}


//==================================================
// Letter Class
//==================================================

/**
 * Represents a single character with position, target, appearance, and behavior.
 */
class Letter {
  /**
   * Creates a new Letter instance.
   * @param {string} letter - The character itself.
   * @param {number} alignedX - The target X position when aligned.
   * @param {number} alignedY - The target Y position when aligned.
   * @param {number} [x] - Optional initial X position (defaults to alignedX).
   * @param {number} [y] - Optional initial Y position (defaults to alignedY).
   */
  constructor(letter, alignedX, alignedY, x, y) {
    this.letter = letter;         // The character string
    this.alignedX = alignedX;     // Target X position
    this.alignedY = alignedY;     // Target Y position
    // Set initial position: use provided x/y if they exist, otherwise start at aligned position.
    this.x = (x !== undefined) ? x : alignedX;
    this.y = (y !== undefined) ? y : alignedY;

    // --- Appearance ---
    // Randomly choose a font and text color from the configured lists.
    this.font = random(config.fontList);
    this.textColor = random(config.textColors);

    // --- Noise Offsets for Drifting ---
    // Initialize unique random offsets for Perlin noise calculation.
    // This makes each letter drift independently.
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000);
  }

  /** Updates the letter's position to move towards its aligned target using lerp. */
  updateAligned() {
    // Smoothly interpolate current position (x, y) towards the target (alignedX, alignedY).
    this.x = lerp(this.x, this.alignedX, config.lerpSpeed);
    this.y = lerp(this.y, this.alignedY, config.lerpSpeed);
  }

  /** Updates the letter's position based on Perlin noise for drifting effect. */
  updateDrifting() {
    // Calculate drift amounts using Perlin noise, mapped to the configured range.
    let driftX = map(noise(this.noiseOffsetX), 0, 1, -config.noiseRange, config.noiseRange);
    let driftY = map(noise(this.noiseOffsetY), 0, 1, -config.noiseRange, config.noiseRange);

    // Apply the drift to the current position.
    this.x += driftX;
    this.y += driftY;

    // Increment noise offsets to make the noise value change over time, creating movement.
    this.noiseOffsetX += config.noiseIncrement;
    this.noiseOffsetY += config.noiseIncrement;
  }

  /**
   * Draws the letter onto a specified p5.Graphics buffer.
   * @param {p5.Graphics} buffer - The graphics buffer to draw onto (e.g., the offscreen buffer pg).
   */
  display(buffer) {
    buffer.push(); // Isolate drawing settings for this letter.
    buffer.textFont(this.font); // Set the letter's unique font.
    buffer.fill(this.textColor); // Set the letter's unique color.
    // buffer.noStroke(); // Ensure no outline if desired
    buffer.text(this.letter, this.x, this.y); // Draw the letter character at its current position.
    buffer.pop(); // Restore previous drawing settings.
  }
}


//==================================================
// Window Resize Handling
//==================================================

/**
 * Handles browser window resize events to make the sketch responsive.
 */
function windowResized() {
    console.log("Window resized detected.");
    // Find the container div again.
    let container = document.getElementById("typography-canvas");
    if (!container) {
        console.warn("Cannot resize: Container '#typography-canvas' not found.");
        return;
    }

    // Get new dimensions from the container.
    let w = container.offsetWidth;
    let h = container.offsetHeight;

    // Resize the main p5 canvas.
    resizeCanvas(w, h);
    // IMPORTANT: Resize the offscreen graphics buffer as well.
    pg.resizeCanvas(w, h);
    console.log(`Canvas and buffer resized to: ${w}x${h}`);

    // --- Recalculate Letter Positions ---
    // If the letters are currently supposed to be aligned (or transitioning to alignment),
    // we need to recalculate their target positions based on the new canvas size.
    // We don't recalculate if they are freely drifting, as their target is irrelevant then.
    if (phase === "aligned") {
        console.log("Recalculating letter positions for new size (aligned phase).");
        // Recreate letters using the current word; this recalculates alignedX/Y based on new width/height.
        // Letters will start interpolating from their current positions to the new targets.
        createLettersFromCurrent(words[currentWordIndex]);
        // Reset align start time as positions need to re-align
        alignStartTime = millis();
    } else {
        console.log("Window resized during drifting phase. Positions not recalculated.");
    }
}