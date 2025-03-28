// typographySketch.js
// Minimal tile-warp animation of text moving left-right with textSize=300, optimized for performance (no mouse interaction).

let oswaldFont;
let pg;       // offscreen buffer
const txt = "a"; // text to display

// Adjust tile counts for performance vs. effect
const tilesX = 8;
const tilesY = 12;

function preload() {
  // Load the Oswald font (adjust path if needed)
  oswaldFont = loadFont('./fonts/Oswald-Regular.ttf');
}

function setup() {
  // Disable high-pixel-density rendering for better performance
  pixelDensity(.7);
  
  // Create canvas based on container width (square)
  const container = document.querySelector('.typography-canvas');
  const size = container.offsetWidth;
  const canvas = createCanvas(size, size);
  canvas.parent(container);
  
  // Disable smoothing on main canvas
  noSmooth();
  
  // Create offscreen buffer and disable smoothing
  pg = createGraphics(size, size);
  pg.noSmooth();
  
  // Set text properties in offscreen buffer
  pg.textFont(oswaldFont);
  pg.textSize(300);
  pg.textAlign(CENTER, CENTER);
  
  // Target 60 FPS
  frameRate(60);
}

function draw() {
  // Main canvas background
  background('#0300BF');

  // Time variable for smooth left-right motion
  const t = millis() * 0.001;
  
  // Measure text width each frame to adapt if window is resized
  const textW = pg.textWidth(txt);
  const halfTextW = textW / 2;
  
  // Left/Right edges ensure text doesn't clip off the canvas
  const leftEdge = halfTextW;
  const rightEdge = width - halfTextW;

  // Map sin(t) from -1..1 into leftEdge..rightEdge
  const posX = map(sin(t), -1, 1, leftEdge, rightEdge);
  
  // Warp factor: 0 at leftEdge, 50 at rightEdge
  // (we clamp posX so it never goes below leftEdge or above rightEdge)
  const warpFactor = map(posX, leftEdge, rightEdge, 0, 50, true);

  // Draw text onto offscreen buffer
  pg.clear();
  pg.fill('#FF00C8'); // light text color
  pg.noStroke();
  const posY = height / 10;
  pg.text(txt, posX, posY);

  // Calculate tile dimensions
  const tileW = width / tilesX;
  const tileH = height / tilesY;

  // Convert tile dims to integers for copy()
  const iTileW = floor(tileW);
  const iTileH = floor(tileH);

  // Warp each tile as we copy from pg
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      // Precompute wave base to reduce repeated calculations
      const waveBase1 = (tx + ty + t) * 0.5;
      const waveBase2 = (tx - ty - t) * 0.5;

      // Minimal sine-based warp
      const waveX = sin(waveBase1) * warpFactor;
      const waveY = cos(waveBase2) * warpFactor;

      // Source coords on pg (convert to integers)
      const sx = floor(tx * tileW + waveX);
      const sy = floor(ty * tileH + waveY);

      // Destination coords on main canvas
      const dx = floor(tx * tileW);
      const dy = floor(ty * tileH);

      copy(pg, sx, sy, iTileW, iTileH, dx, dy, iTileW, iTileH);
    }
  }
}

function windowResized() {
  const container = document.querySelector('.typography-canvas');
  const size = container.offsetWidth;
  resizeCanvas(size, size);
  pg.resizeCanvas(size, size);
}
