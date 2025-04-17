


let inputFont; 
let bgFont;    
let failFont;  

let target = "FAILURE";
let typedLen = 0;       
let failTimer = 0;      
const FAIL_DURATION = 30 * 0.5; 


let failCount = 0;      
let failThreshold = 1;  


let FAILURE_WORDS = ["NOPE", "AGAIN", "WRONG", "FAILED", "NOPE", "MISTAKE"];
let currentFailWord = ""; 


let letterPositions = [];
let totalWidth = 0;


let lastTypedLetter = "";


let cursorBlink = true;
const CURSOR_BLINK_INTERVAL = 30;




let typedScale = 0.3;  
let typedPosX = 0.5;   
let typedPosY = 0.3;   
let typedColor = "#625FF0";


let failWordSize = 60;           
let failWordColor = "#720000";   
const FAIL_SIZE_INCREMENT = 15;  
const MAX_FAIL_SIZE = 140;       


let typedLettersColor = "white";   
let placeholderColor = "#625FF0";  


function preload() {
  inputFont = loadFont("./fonts/AmericanTypewriter-Regular.ttf");
  bgFont    = loadFont("./fonts/Babylonica-Regular.ttf");
  failFont  = loadFont("./fonts/BrokenDetroit-Regular.ttf");
}

function setup() {
  
  let container = document.querySelector(".typography-canvas.week3");
  
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  
  
  const canvas = createCanvas(w, h);
  canvas.parent(container);
  
  textAlign(LEFT, CENTER);
  textFont(inputFont);
  textSize(50);
  
  computeLetterPositions();
}

function draw() {
  
  if (failTimer > 0) {
    background("red"); 
  } else {
    background("#0300BF"); 
  }
  
  
  if (failTimer === 0) {
    drawBackgroundLetter();
  }
  
  
  if (failTimer > 0) {
    failTimer--;
    let shakeAmt = 5;
    let offsetX = random(-shakeAmt, shakeAmt);
    let offsetY = random(-shakeAmt, shakeAmt);
    
    push();
      translate(width / 2 + offsetX, height / 2 + offsetY);
      drawFailWord();
    pop();
  } else {
    
    push();
      translate(width / 2, height / 2);
      drawPlaceholder();
    pop();
  }
  
  
  if (frameCount % CURSOR_BLINK_INTERVAL === 0) {
    cursorBlink = !cursorBlink;
  }
}


function drawBackgroundLetter() {
  if (lastTypedLetter === "" || failTimer > 0) return; 
  
  push();
    textFont(bgFont);
    textAlign(CENTER, CENTER);
    textSize(width * typedScale);
    fill(typedColor);
    text(lastTypedLetter, width * typedPosX, height * typedPosY);
  pop();
}


function drawPlaceholder() {
  let startX = -totalWidth / 2;
  
  for (let i = 0; i < target.length; i++) {
    let xPos = startX + letterPositions[i];
    let letter = target[i];
    
    if (i < typedLen) {
      fill(typedLettersColor);
    } else {
      fill(placeholderColor);
    }
    text(letter, xPos, 0);
  }
  
  
  if (cursorBlink) {
    let cursorX = startX + letterPositions[typedLen] + 5;
    stroke("#FFFFFF");
    strokeWeight(2);
    line(cursorX, -20, cursorX, 35);
  }
}


function drawFailWord() {
  push();
    textAlign(CENTER, CENTER);
    textFont(failFont);
    textSize(failWordSize);
    fill(failWordColor);
    text(currentFailWord, 0, 0);
  pop();
}



function keyTyped() {
  if (failTimer > 0) return; 
  
  let typedChar = key.toUpperCase();
  lastTypedLetter = typedChar;
  
  let nextLetter = target.charAt(typedLen);
  
  if (typedChar === nextLetter) {
    
    let forcedFailIndex = getForcedFailIndex();
    if (typedLen >= forcedFailIndex) {
      triggerFail();
      return;
    }
    typedLen++;
  } else {
    triggerFail();
  }
}


function getForcedFailIndex() {
  let baseFailIndex = target.length - 2; 
  let adjustedFailIndex = baseFailIndex - floor(failCount / failThreshold);
  return max(0, adjustedFailIndex);
}


function triggerFail() {
  failTimer = FAIL_DURATION;
  typedLen = 0;
  currentFailWord = random(FAILURE_WORDS);
  
  
  if (failWordSize < MAX_FAIL_SIZE) {
    failWordSize += FAIL_SIZE_INCREMENT;
    failWordSize = min(failWordSize, MAX_FAIL_SIZE);
  }
  
  
  failCount++;
}


function computeLetterPositions() {
  letterPositions = [];
  totalWidth = 0;
  
  for (let i = 0; i < target.length; i++) {
    let cw = textWidth(target[i]);
    letterPositions.push(totalWidth);
    totalWidth += cw;
  }
}


function windowResized() {
  
  let container = document.querySelector(".typography-canvas.week3");
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  resizeCanvas(w, h);
  computeLetterPositions();
}
