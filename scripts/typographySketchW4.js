

let words = ["MEMORY", "BLURRED", "AGAIN", "SO FAMILIAR", "LOOPING", "UNKNOWN"]; 
let customFont;

let currentIndex = 0;

let displayArray = [];
let targetArray = [];
let isRed = [];


let state = "SCRAMBLING";
let frameTimer = 0;
let holdDuration = 90;
let unscrambleSpeed = 0.02;
let scrambleSpeed = 0.09;


let currentLetterSize; 
const letterSizeRatio = 0.45; 


const defaultCanvasHeight = 200;
const mobileCanvasHeight = 130;
const mobileBreakpoint = 400;
const textPadding = 0.90; 





function preload() {
  customFont = loadFont("./fonts/FrederickatheGreat-Regular.ttf"); 
}

function setup() {
  let container = document.querySelector(".typography-canvas.week4");
  if (!container) {
    console.error("Container element '.typography-canvas.week4' not found!");
    createCanvas(windowWidth, defaultCanvasHeight); 
    return;
  }

  let w = container.offsetWidth;
  let h = getDynamicCanvasHeight();

  let cnv = createCanvas(w, h);
  cnv.parent(container);

  textAlign(LEFT, CENTER);
  textFont(customFont);
  

  initWord(words[currentIndex]); 
}

function draw() {
  let currentHeight = getDynamicCanvasHeight();
  if (height !== currentHeight) {
    windowResized(); 
  }

  let centerY = height / 2;
  background("#0300BF");

  
  runStateMachine();

  
  
  textSize(currentLetterSize);
  drawDisplayArray(centerY);
}

function windowResized() {
  let container = document.querySelector(".typography-canvas.week4");
  if (!container) return;

  let w = container.offsetWidth;
  let h = getDynamicCanvasHeight();

  resizeCanvas(w, h);

  
  
  setCurrentTextSizeForWord(targetArray);
  textSize(currentLetterSize); 
}





function getDynamicCanvasHeight() {
  
  const w = typeof windowWidth !== 'undefined' ? windowWidth : window.innerWidth;
  if (w <= mobileBreakpoint) {
    return mobileCanvasHeight;
  } else {
    return defaultCanvasHeight;
  }
}


function setCurrentTextSizeForWord(wordArray) {
  if (!wordArray || wordArray.length === 0) {
      currentLetterSize = getDynamicCanvasHeight() * letterSizeRatio; 
      return;
  }

  let baseLetterSize = getDynamicCanvasHeight() * letterSizeRatio;
  let availableWidth = width * textPadding; 

  
  textSize(baseLetterSize);
  let targetText = wordArray.join('');
  let targetWidth = textWidth(targetText);

  
  if (targetWidth > availableWidth && availableWidth > 0) {
    let scaleFactor = availableWidth / targetWidth;
    currentLetterSize = baseLetterSize * scaleFactor;
  } else {
    
    currentLetterSize = baseLetterSize;
  }
  
  currentLetterSize = max(currentLetterSize, 10); 
}


function runStateMachine() {
  if (state === "SCRAMBLING") {
    scrambleLetters(scrambleSpeed);
    frameTimer++;
    if (frameTimer > 60) {
      state = "UNSCRAMBLING";
      frameTimer = 0;
    }
  } else if (state === "UNSCRAMBLING") {
    unscrambleLetters(unscrambleSpeed);
    if (arraysMatch(displayArray, targetArray)) {
      state = "HOLD";
      frameTimer = 0;
    }
  } else if (state === "HOLD") {
    frameTimer++;
    if (frameTimer > holdDuration) {
      state = "TRANSITION";
      frameTimer = 0;
      currentIndex = (currentIndex + 1) % words.length;
      initWord(words[currentIndex]);
    }
  } else if (state === "TRANSITION") {
    scrambleLetters(scrambleSpeed);
    frameTimer++;
    if (frameTimer > 60) {
      state = "UNSCRAMBLING";
      frameTimer = 0;
    }
  }
}

function drawDisplayArray(centerY) {
  
  textSize(currentLetterSize);

  let wordStr = displayArray.join("");
  let totalW = textWidth(wordStr);
  let startX = width / 2 - totalW / 2; 
  let x = startX;

  for (let i = 0; i < displayArray.length; i++) {
    let letterColor = "#FFF"; 

    if (state === "HOLD") {
      letterColor = "#FF0000";
    } else if (isRed[i] && displayArray[i] === targetArray[i]) {
      letterColor = "#FF0000";
    }

    fill(letterColor);
    
    if (displayArray[i] !== undefined) {
       let charToDraw = displayArray[i];
       text(charToDraw, x, centerY);
       x += textWidth(charToDraw); 
    }
  }
}



function initWord(newWord) {
  targetArray = newWord.split("");
  isRed = new Array(targetArray.length).fill(false);

  
  setCurrentTextSizeForWord(targetArray);
  
  textSize(currentLetterSize);

  displayArray = new Array(targetArray.length);
  for (let i = 0; i < displayArray.length; i++) {
    if (targetArray[i] === " ") {
      displayArray[i] = " ";
    } else {
      displayArray[i] = randomChar();
    }
  }

  state = "TRANSITION";
  frameTimer = 0;
}



function unscrambleLetters(prob) {
  for (let i = 0; i < displayArray.length; i++) {
    if (displayArray[i] !== targetArray[i]) {
      if (targetArray[i] === " ") {
        displayArray[i] = " ";
        continue;
      }
      if (random() < prob) {
        displayArray[i] = targetArray[i];
        isRed[i] = true;
      }
    } else if (displayArray[i] === targetArray[i] && targetArray[i] !== " ") {
      isRed[i] = true;
    }
  }
}

function scrambleLetters(prob) {
  for (let i = 0; i < displayArray.length; i++) {
    if (targetArray[i] === " ") {
      displayArray[i] = " ";
      continue;
    }
    if (random() < prob) {
      displayArray[i] = randomChar();
      isRed[i] = false;
    }
  }
}



function randomChar() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?@#$%1234567890";
  return chars.charAt(floor(random(chars.length)));
}

function arraysMatch(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}