


let oswaldFont;
let pg;       
const txt = "a"; 


const tilesX = 8;
const tilesY = 12;

function preload() {
  
  oswaldFont = loadFont('./fonts/Oswald-Regular.ttf');
}

function setup() {
  
  pixelDensity(.7);
  
  
  const container = document.querySelector('.typography-canvas');
  const size = container.offsetWidth;
  const canvas = createCanvas(size, size);
  canvas.parent(container);
  
  
  noSmooth();
  
  
  pg = createGraphics(size, size);
  pg.noSmooth();
  
  
  pg.textFont(oswaldFont);
  pg.textSize(300);
  pg.textAlign(CENTER, CENTER);
  
  
  frameRate(60);
}

function draw() {
  
  background('#0300BF');

  
  const t = millis() * 0.001;
  
  
  const textW = pg.textWidth(txt);
  const halfTextW = textW / 2;
  
  
  const leftEdge = halfTextW;
  const rightEdge = width - halfTextW;

  
  const posX = map(sin(t), -1, 1, leftEdge, rightEdge);
  
  
  
  const warpFactor = map(posX, leftEdge, rightEdge, 0, 50, true);

  
  pg.clear();
  pg.fill('#FF00C8'); 
  pg.noStroke();
  const posY = height / 10;
  pg.text(txt, posX, posY);

  
  const tileW = width / tilesX;
  const tileH = height / tilesY;

  
  const iTileW = floor(tileW);
  const iTileH = floor(tileH);

  
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      
      const waveBase1 = (tx + ty + t) * 0.5;
      const waveBase2 = (tx - ty - t) * 0.5;

      
      const waveX = sin(waveBase1) * warpFactor;
      const waveY = cos(waveBase2) * warpFactor;

      
      const sx = floor(tx * tileW + waveX);
      const sy = floor(ty * tileH + waveY);

      
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
