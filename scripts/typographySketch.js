// glassEffectSmallScaled.js
// Same code, smaller canvas, smaller text, smaller ellipse,
// plus a custom font loaded in preload().

let pg;
let customFont;

// Preload the custom font
function preload() {
  // Adjust the path/filename as needed (e.g., ./fonts/YourCustomFont.ttf)
  customFont = loadFont('./fonts/Bodoni.ttf');
}

function setup() {

  // Create a smaller canvas and parent it to #typography-canvas
  const canvas = createCanvas(300, 200);
  canvas.parent("typography-canvas");

  noCursor();
  colorMode(HSB);

  // Offscreen buffer, same size
  pg = createGraphics(300, 200);
  pg.noSmooth();
  pg.colorMode(HSB);

  // Use custom font in both the main canvas & pg if desired
  textFont(customFont);
  pg.textFont(customFont);
}

function draw() {
  let H = frameCount / 3 % 360;

  // Main background
  // background("#0300BF");
  background("#0300BF");


  // Draw text & ellipse onto pg
  pg.fill(H, 100, 100);
  // Use custom font
  pg.textFont(customFont);
  pg.textSize(80);

  pg.push();
    pg.translate(width / 2, height / 2);
    pg.textAlign(CENTER, CENTER);
    pg.textLeading(0);
    pg.text("SELF", 0, 0);
  pg.pop();

  pg.push();
    pg.noStroke();
    pg.fill(H, 100, 100);
    // smaller ellipse size from 15 to 8
    pg.ellipse(mouseX, mouseY, 8);
  pg.pop();

  // Same tile logic, still 20x20 tiles
  let tilesX = 15;
  let tilesY = 15;
  
  let tileW = int(width / tilesX);
  let tileH = int(height / tilesY);

  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      // WAVE
      let wave = int(sin((frameCount + x * y) * 0.01) * 12);

      // SOURCE
      let sx = x * tileW + wave;
      let sy = y * tileH + wave;
      let sw = tileW;
      let sh = tileH;

      // DESTINATION
      let dx = x * tileW;
      let dy = y * tileH;
      let dw = tileW;
      let dh = tileH;

      copy(
        pg,
        sx, sy, sw + mouseX - int(width / 2),
        sh + mouseY - int(height / 2),
        dx, dy, dw, dh
      );
    }
  }
}