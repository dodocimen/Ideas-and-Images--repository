



const config = {
  
  canvasWidth: 750,         
  canvasHeight: 400,        
  textSize: 110,            
  letterSpacing: 60,        
  alignDuration: 1000,      
  bgColor: "#1E1E1E",       
  textColors: ["#EBEBEB", "#FFC300", "#FF845D"], 
  fontList: [],             
  lerpSpeed: 0.1,           
  noiseIncrement: 0.01,     
  noiseRange: 2,            
  attractionThreshold: 100, 
  attractionStrength: 0.05, 
  
  tilesX: 6,                
  tilesY: 6,                
  maxWarp: 20               
};


const TIME_MULTIPLIER = 0.001; 
const WAVE_MULTIPLIER_1 = 0.5; 
const WAVE_MULTIPLIER_2 = 0.5; 



let oswaldFont, robotoFont, latoFont, montserratFont;


const words = ["COPY", "BREAK", "REBUILD", "CREATE", "EVOLVE"]; 
let currentWordIndex = 0; 
let letters = [];         
let phase = "aligned";    
let alignStartTime;       


let pg; 







function preload() {
  
  
  try {
    oswaldFont = loadFont("./fonts/AmericanTypewriter-Regular.ttf");
    robotoFont = loadFont("./fonts/BrokenDetroit-Regular.ttf");
    latoFont = loadFont("./fonts/Boldonse-Regular.ttf");
    montserratFont = loadFont("./fonts/RoadRage-Regular.ttf");

    
    config.fontList = [oswaldFont, robotoFont, latoFont, montserratFont];
    console.log("Fonts loaded successfully.");
  } catch (error) {
    console.error("Error loading fonts:", error);
    
    config.fontList = ["sans-serif"]; 
  }
}


function setup() {
  
  
  let container = document.getElementById("typography-canvas");
  if (!container) {
      console.error("Container element '#typography-canvas' not found! Creating default canvas.");
      
      createCanvas(config.canvasWidth, config.canvasHeight);
  } else {
      
      let w = container.offsetWidth;
      let h = container.offsetHeight;
      let myCanvas = createCanvas(w, h);
      myCanvas.parent("typography-canvas"); 
      console.log(`Canvas created with container size: ${w}x${h}`);
  }

  
  
  textSize(config.textSize);
  textAlign(CENTER, CENTER); 

  
  
  
  pg = createGraphics(width, height);
  pg.noSmooth(); 
  pg.textSize(config.textSize); 
  pg.textAlign(CENTER, CENTER); 

  
  
  createLetters(words[currentWordIndex]);
  
  alignStartTime = millis();

  console.log("Setup complete. Initial word:", words[currentWordIndex]);
}


function draw() {
  
  background(config.bgColor);

  
  
  if (phase === "aligned") {
    
    for (let letter of letters) {
      letter.updateAligned();
    }
    
    if (millis() - alignStartTime > config.alignDuration) {
      console.log("Phase changing to: drifting");
      phase = "drifting"; 
    }
  } else if (phase === "drifting") {
    
    for (let letter of letters) {
      letter.updateDrifting();
    }
  }

  
  
  for (let letter of letters) {
    let d = dist(mouseX, mouseY, letter.x, letter.y); 
    if (d < config.attractionThreshold) {
      
      letter.x += (mouseX - letter.x) * config.attractionStrength;
      letter.y += (mouseY - letter.y) * config.attractionStrength;
    }
  }

  
  pg.clear(); 
  pg.background(config.bgColor); 
  
  for (let letter of letters) {
    letter.display(pg);
  }

  
  
  applyTileWarpEffect(pg);
}







function mousePressed() {
  
  if (phase === "drifting") {
    console.log("Mouse pressed during drifting phase. Transitioning word.");
    
    currentWordIndex = (currentWordIndex + 1) % words.length;
    
    createLettersFromCurrent(words[currentWordIndex]);
    
    phase = "aligned";
    
    alignStartTime = millis();
  } else {
      console.log("Mouse pressed during aligned phase. No action.");
  }
}


function createLetters(word) {
  letters = []; 
  let totalWidth = (word.length - 1) * config.letterSpacing; 
  let startX = width / 2 - totalWidth / 2; 

  
  for (let i = 0; i < word.length; i++) {
    let char = word.charAt(i);
    let targetX = startX + i * config.letterSpacing; 
    let targetY = height / 2; 
    
    letters.push(new Letter(char, targetX, targetY));
  }
  console.log(`Created letters for word: "${word}"`);
}


function createLettersFromCurrent(word) {
  let newLetters = []; 
  let totalWidth = (word.length - 1) * config.letterSpacing; 
  let startX = width / 2 - totalWidth / 2; 

  
  for (let i = 0; i < word.length; i++) {
    let char = word.charAt(i);
    let targetX = startX + i * config.letterSpacing; 
    let targetY = height / 2; 
    let initialX, initialY;

    
    if (i < letters.length) {
      initialX = letters[i].x;
      initialY = letters[i].y;
    } else {
      
      initialX = width / 2 + random(-config.letterSpacing, config.letterSpacing);
      initialY = height / 2 + random(-config.letterSpacing, config.letterSpacing);
    }
    
    newLetters.push(new Letter(char, targetX, targetY, initialX, initialY));
  }
  
  letters = newLetters;
  console.log(`Transitioned letters to word: "${word}"`);
}



function applyTileWarpEffect(sourceBuffer) {
  
  let timeSeconds = millis() * TIME_MULTIPLIER;

  
  let tileW = width / config.tilesX;
  let tileH = height / config.tilesY;
  
  let iTileW = floor(tileW);
  let iTileH = floor(tileH);

  
  let warpAmplitude = map(sin(timeSeconds), -1, 1, 0, config.maxWarp, true);

  
  for (let ty = 0; ty < config.tilesY; ty++) {
    for (let tx = 0; tx < config.tilesX; tx++) {
      
      
      let waveBase1 = (tx + ty + timeSeconds) * WAVE_MULTIPLIER_1;
      let waveBase2 = (tx - ty - timeSeconds) * WAVE_MULTIPLIER_2;
      let waveOffsetX = sin(waveBase1) * warpAmplitude; 
      let waveOffsetY = cos(waveBase2) * warpAmplitude; 

      
      
      let sx = floor(tx * tileW + waveOffsetX);
      let sy = floor(ty * tileH + waveOffsetY);

      
      let dx = floor(tx * tileW);
      let dy = floor(ty * tileH);

      
      
      
      copy(sourceBuffer, sx, sy, iTileW, iTileH, dx, dy, iTileW, iTileH);
    }
  }
}







class Letter {
  
  constructor(letter, alignedX, alignedY, x, y) {
    this.letter = letter;         
    this.alignedX = alignedX;     
    this.alignedY = alignedY;     
    
    this.x = (x !== undefined) ? x : alignedX;
    this.y = (y !== undefined) ? y : alignedY;

    
    
    this.font = random(config.fontList);
    this.textColor = random(config.textColors);

    
    
    
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

  
  display(buffer) {
    buffer.push(); 
    buffer.textFont(this.font); 
    buffer.fill(this.textColor); 
    
    buffer.text(this.letter, this.x, this.y); 
    buffer.pop(); 
  }
}







function windowResized() {
    console.log("Window resized detected.");
    
    let container = document.getElementById("typography-canvas");
    if (!container) {
        console.warn("Cannot resize: Container '#typography-canvas' not found.");
        return;
    }

    
    let w = container.offsetWidth;
    let h = container.offsetHeight;

    
    resizeCanvas(w, h);
    
    pg.resizeCanvas(w, h);
    console.log(`Canvas and buffer resized to: ${w}x${h}`);

    
    
    
    
    if (phase === "aligned") {
        console.log("Recalculating letter positions for new size (aligned phase).");
        
        
        createLettersFromCurrent(words[currentWordIndex]);
        
        alignStartTime = millis();
    } else {
        console.log("Window resized during drifting phase. Positions not recalculated.");
    }
}