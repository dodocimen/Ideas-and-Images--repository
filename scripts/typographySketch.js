// Responsive p5 sketch: typographySketch.js

let pg;         // Offscreen graphics buffer for effects
let customFont; // Custom font variable

// Preload the custom font before the sketch starts
function preload() {
  // Adjust the path to your custom font as needed
  customFont = loadFont('./fonts/Bodoni.ttf');
}

function setup() {
  // Get the container element that holds the canvas
  const container = document.getElementById('typography-canvas');
  
  // Create a canvas that fills the container's width and height
  let canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  // Parent the canvas to the container so it inherits its layout
  canvas.parent("typography-canvas");

  noCursor();      // Hide the cursor on the canvas
  colorMode(HSB);  // Use Hue, Saturation, Brightness mode

  // Create an offscreen graphics buffer (pg) with the same dimensions
  pg = createGraphics(container.offsetWidth, container.offsetHeight);
  pg.noSmooth();      // Disable smoothing for a pixelated effect (if desired)
  pg.colorMode(HSB);  // Ensure the offscreen buffer uses the same color mode

  // Set the custom font for text rendering in both the main canvas and pg
  textFont(customFont);
  pg.textFont(customFont);
}

function draw() {
  // Calculate a dynamic hue value based on the frame count
  let H = frameCount / 3 % 360;

  // Clear the main canvas background with the defined color
  background("#0300BF");

  // --- Offscreen Graphics (pg) ---
  // Draw text onto pg
  pg.fill(H, 100, 100);
  pg.textFont(customFont);
  pg.textSize(150);
  pg.push();
    // Center the text on the offscreen buffer
    pg.translate(width / 2, height / 2);
    pg.textAlign(CENTER, CENTER);
    pg.textLeading(0);
    pg.text("SELF", 0, 0);
  pg.pop();

  // Draw a small ellipse that follows the mouse on pg
  pg.push();
    pg.noStroke();
    pg.fill(H, 100, 100);
    pg.ellipse(mouseX, mouseY, 10);
  pg.pop();

  // --- Tiling Distortion Effect ---
  // Define the number of tiles in X and Y directions
  let tilesX = 8;
  let tilesY = 6;
  
  // Calculate each tile's width and height based on the canvas size
  let tileW = int(width / tilesX);
  let tileH = int(height / tilesY);

  // Loop over a grid to copy parts of pg onto the main canvas with a distortion
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      // Compute a wave offset for dynamic distortion
      let wave = int(sin((frameCount + x * y) * 0.01) * 12);

      // Source parameters from the offscreen buffer (pg)
      let sx = x * tileW + wave;
      let sy = y * tileH + wave;
      let sw = tileW;
      let sh = tileH;

      // Destination parameters on the main canvas
      let dx = x * tileW;
      let dy = y * tileH;
      let dw = tileW;
      let dh = tileH;

      // Copy a portion of pg to the main canvas with dynamic offsets influenced by mouse position
      copy(
        pg,
        sx, sy,
        sw + mouseX - int(width / 2), // Adjust width based on mouseX
        sh + mouseY - int(height / 2), // Adjust height based on mouseY
        dx, dy,
        dw, dh
      );
    }
  }
}

// This function automatically runs whenever the window is resized.
// It resizes both the main canvas and the offscreen graphics buffer to fit the container.
function windowResized() {
  const container = document.getElementById('typography-canvas');
  // Resize the main canvas to the container's new width and height
  resizeCanvas(container.offsetWidth, container.offsetHeight);
  // Also update the offscreen graphics buffer (pg) to the new dimensions
  pg.resizeCanvas(container.offsetWidth, container.offsetHeight);
}
