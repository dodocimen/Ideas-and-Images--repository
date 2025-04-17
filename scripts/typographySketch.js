

let pg;         
let customFont; 


function preload() {
  
  customFont = loadFont('./fonts/Bodoni.ttf');
}

function setup() {
  
  const container = document.getElementById('typography-canvas');
  
  
  let canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  
  canvas.parent("typography-canvas");

  noCursor();      
  colorMode(HSB);  

  
  pg = createGraphics(container.offsetWidth, container.offsetHeight);
  pg.noSmooth();      
  pg.colorMode(HSB);  

  
  textFont(customFont);
  pg.textFont(customFont);
}

function draw() {
  
  let H = frameCount / 3 % 360;

  
  background("#0300BF");

  
  
  pg.fill(H, 100, 100);
  pg.textFont(customFont);
  pg.textSize(150);
  pg.push();
    
    pg.translate(width / 2, height / 2);
    pg.textAlign(CENTER, CENTER);
    pg.textLeading(0);
    pg.text("SELF", 0, 0);
  pg.pop();

  
  pg.push();
    pg.noStroke();
    pg.fill(H, 100, 100);
    pg.ellipse(mouseX, mouseY, 10);
  pg.pop();

  
  
  let tilesX = 8;
  let tilesY = 6;
  
  
  let tileW = int(width / tilesX);
  let tileH = int(height / tilesY);

  
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      
      let wave = int(sin((frameCount + x * y) * 0.01) * 12);

      
      let sx = x * tileW + wave;
      let sy = y * tileH + wave;
      let sw = tileW;
      let sh = tileH;

      
      let dx = x * tileW;
      let dy = y * tileH;
      let dw = tileW;
      let dh = tileH;

      
      copy(
        pg,
        sx, sy,
        sw + mouseX - int(width / 2), 
        sh + mouseY - int(height / 2), 
        dx, dy,
        dw, dh
      );
    }
  }
}



function windowResized() {
  const container = document.getElementById('typography-canvas');
  
  resizeCanvas(container.offsetWidth, container.offsetHeight);
  
  pg.resizeCanvas(container.offsetWidth, container.offsetHeight);
}
