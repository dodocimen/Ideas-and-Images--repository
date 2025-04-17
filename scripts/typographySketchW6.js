


let currentState = "start"; 
let swirlWords = [];        



let hatMeanings = [
  "White Hat: Clarity, Neutrality, Facts",
  "Red Hat: Emotions, Intuition, Sensitivity",
  "Black Hat: Skepticism, Risks, Critique",
  "Yellow Hat: Positivity, Benefits, Sunshine",
  "Green Hat: Creativity, Growth, Possibility",
  "Blue Hat: Organization, Control, Management"
];


let revealedHatIndex = 2;

function setup() {
  createCanvas(800, 600);

  
  

  
  
  createSwirlWords(hatMeanings[revealedHatIndex]);
}

function draw() {
  background(20);

  if (currentState === "start") {
    
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Click on a Hat (Simulation)", width / 2, height / 2);
  } 
  else if (currentState === "reveal") {
    drawTypographicCard();
  }
}


function createSwirlWords(meaningString) {
  swirlWords = [];
  
  
  let wordsArray = meaningString.split(" ");
  
  for (let i = 0; i < wordsArray.length; i++) {
    let w = wordsArray[i];

    swirlWords.push({
      text: w,
      
      angle: random(TWO_PI),
      
      radius: random(50, 150),
      
      speed: random(0.005, 0.02),
      
      size: random(14, 30),
      
      color: color(random(100,255), random(100,255), random(100,255))
    });
  }
}


function drawTypographicCard() {
  
  
  push();
  noStroke();
  fill(100, 50); 
  rectMode(CENTER);
  rect(width/2, height/2, 400, 400, 20);
  pop();
  
  
  for (let i = 0; i < swirlWords.length; i++) {
    let sw = swirlWords[i];
    
    
    sw.angle += sw.speed;
    
    
    let xPos = width/2 + sw.radius * cos(sw.angle);
    let yPos = height/2 + sw.radius * sin(sw.angle);
    
    
    fill(sw.color);
    textSize(sw.size);
    textAlign(CENTER, CENTER);
    text(sw.text, xPos, yPos);
  }
}


function mousePressed() {
  if (currentState === "start") {
    currentState = "reveal";
  } else if (currentState === "reveal") {
    currentState = "start";
  }
}
