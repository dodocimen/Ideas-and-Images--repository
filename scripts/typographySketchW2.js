



let fonts = [];         
let letters = [];       


const FULL_WORDS = ["MASCULINE", "JUDGEMENT", "PRIDE", "EGO", "TOXIC"];
let fullWordIndex = 0;  


const SINGLE_CHARS = ["A", "B", "C", "D", "E", "X", "Y", "Z", "!", "?"];


let isPressingOnCanvas = false;


let lastColorSwitch = -1;
let hasSpawnedFullWord = false; 




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
  
  let insideCanvas = (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height);
  isPressingOnCanvas = (mouseIsPressed && insideCanvas);

  
  if (!isPressingOnCanvas) {
    background("#0300BF");
    hasSpawnedFullWord = false; 
  } else {
    
    let colorSwitch = floor(frameCount / 5) % 2;
    
    if (colorSwitch === 0) {
      background("red");
      
      if (lastColorSwitch !== 0) {
        spawnFullWord();
        hasSpawnedFullWord = true;
      }
    } else {
      background("black");
      
      hasSpawnedFullWord = false;
    }
    lastColorSwitch = colorSwitch;
  }

  
  if ((mouseX !== pmouseX || mouseY !== pmouseY) && !isPressingOnCanvas) {
    letters.push(new Letter(mouseX, mouseY, 24, false));
  }

  
  if (isPressingOnCanvas) {
    
    for (let i = 0; i < 2; i++) {
      letters.push(new Letter(mouseX, mouseY, 20, true));
    }
  }

  
  for (let i = letters.length - 1; i >= 0; i--) {
    letters[i].update();
    letters[i].display();
    
    if (letters[i].offScreen()) {
      letters.splice(i, 1);
    }
  }
}




function spawnFullWord() {
  
  letters.push(new FullWord(mouseX, mouseY, FULL_WORDS[fullWordIndex]));

  
  fullWordIndex = (fullWordIndex + 1) % FULL_WORDS.length;
}





function windowResized() {
  const container = document.getElementById("typography-canvas");
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  resizeCanvas(w, h);
}





class Letter {
  constructor(x, y, size, isFast) {
    this.x = x;
    this.y = y;
    
    this.font = random(fonts);
    
    this.char = random(SINGLE_CHARS);

    this.size = size;
    this.defaultClr = color("#D9D9D9");

    
    if (isFast) {
      
      this.vx = random(-4, 4);
      this.vy = random(-8, -3);
    } else {
      
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





class FullWord {
  constructor(x, y, word) {
    this.x = x;
    this.y = y;
    
    this.font = fonts[0];
    this.word = word;  

    
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
