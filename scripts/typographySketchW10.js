


const MOBILE_BREAKPOINT = 390; 
const MAZE_COLS = 10;
const MAZE_ROWS = 10;
const FLASH_DURATION = 500;    
const PLAYER_SPEED_FACTOR = 15; 
const MIN_PLAYER_SPEED = 1.5;
const DRAG_CLICK_SENSITIVITY = 10; 

const MAX_MOBILE_SPEED_FACTOR = 20; 
const MOBILE_ACCELERATION = 5;   

const config = {
  letterSpacing: 0,             
  bgColor: "#0300BF",          
  wallWords: { words: ["WICKED", "IS GOOD"] }, 
  wallOffsetFactor: 0.15,      
  
  defaultWallTextSize: 25,
  defaultBallDiameter: 15,
  
  mobileWallTextSize: 15,
  mobileBallDiameter: 10,
};


let w; 
let grid = [];
let stack = []; 
let current; 


let player; 
let playerSpeed; 

let mobileSpeedX = 0; 
let mobileSpeedY = 0; 


let controlMode = 'desktop'; 
let moveState = { up: false, down: false, left: false, right: false }; 
let dragging = false; 
let trail = []; 


let flashWalls = false; 
let flashStartTime = 0;


let gameWon = false;


let wallFont;


let arrowButtonContainer; 
let canvasContainerDiv;   
let canvasParentDiv;      
let winContentElement;    
let p5Canvas;             







function updateDynamicSizes(currentWidth) {
  
  if (currentWidth <= MOBILE_BREAKPOINT) {
    controlMode = 'mobile';
    wallTextSize = config.mobileWallTextSize;
    currentBallDiameter = config.mobileBallDiameter;
    console.log("Mode: Mobile");
  } else {
    controlMode = 'desktop';
    wallTextSize = config.defaultWallTextSize;
    currentBallDiameter = config.defaultBallDiameter;
    console.log("Mode: Desktop");
  }

  
  if (arrowButtonContainer) {
      arrowButtonContainer.removeClass('hidden');
      console.log("Arrow buttons forced visible for debugging.");
  } else {
      console.log("updateDynamicSizes: arrowButtonContainer not found yet.");
      
      
  }
  

  
  playerSpeed = max(w / PLAYER_SPEED_FACTOR, MIN_PLAYER_SPEED);
  console.log(`Sizes Updated: Text=${wallTextSize}, Ball=${currentBallDiameter}, BaseSpeed=${playerSpeed.toFixed(2)}`);
}



function index(i, j) {
  if (i < 0 || j < 0 || i >= MAZE_COLS || j >= MAZE_ROWS) return -1;
  return i + j * MAZE_COLS;
}


function removeWalls(a, b) {
  let x = a.i - b.i; if (x === 1) { a.walls[3] = false; b.walls[1] = false; } else if (x === -1) { a.walls[1] = false; b.walls[3] = false; }
  let y = a.j - b.j; if (y === 1) { a.walls[0] = false; b.walls[2] = false; } else if (y === -1) { a.walls[2] = false; b.walls[0] = false; }
}




class Cell {
  constructor(i, j) { this.i = i; this.j = j; this.walls = [true, true, true, true]; this.visited = false; this.wallWords = { top: random(config.wallWords.words), right: random(config.wallWords.words), bottom: random(config.wallWords.words), left: random(config.wallWords.words) }; }
  show() { let x = this.i * w; let y = this.j * w; let wallOffset = w * config.wallOffsetFactor; noStroke(); textSize(wallTextSize); textAlign(CENTER, CENTER); push(); textFont(wallFont); if (flashWalls) fill(255, 0, 0); else fill(255); if (this.walls[0]) { push(); translate(x + w / 2, y + wallOffset); text(this.wallWords.top, 0, 0); pop(); } if (this.walls[1]) { push(); translate(x + w - wallOffset, y + w / 2); rotate(radians(-90)); text(this.wallWords.right, 0, 0); pop(); } if (this.walls[2]) { push(); translate(x + w / 2, y + w - wallOffset); text(this.wallWords.bottom, 0, 0); pop(); } if (this.walls[3]) { push(); translate(x + wallOffset, y + w / 2); rotate(radians(90)); text(this.wallWords.left, 0, 0); pop(); } pop(); }
  checkNeighbors() { let neighbors = []; let top = grid[index(this.i, this.j - 1)]; let right = grid[index(this.i + 1, this.j)]; let bottom = grid[index(this.i, this.j + 1)]; let left = grid[index(this.i - 1, this.j)]; if (top && !top.visited) neighbors.push(top); if (right && !right.visited) neighbors.push(right); if (bottom && !bottom.visited) neighbors.push(bottom); if (left && !left.visited) neighbors.push(left); if (neighbors.length > 0) return random(neighbors); else return undefined; }
}





function preload() {
  
  wallFont = loadFont("./fonts/RoadRage-Regular.ttf");
  console.log("Font loaded.");
}

function setup() {
    console.log("W10 Maze Sketch Setup started.");
    
    initializeDOMReferences();

    
    let canvasWidth = canvasParentDiv.elt.clientWidth || 400; 
    let canvasHeight = canvasWidth; 
    p5Canvas = createCanvas(canvasWidth, canvasHeight);
    p5Canvas.parent(canvasParentDiv); 

    console.log(`W10 Maze Canvas created: ${width}x${height}`);
    
    w = width / MAZE_COLS;

    
    setupArrowControls(); 

    
    updateDynamicSizes(width); 
    showGameContent();         
    initializeMaze();          
    initializePlayer();        
    resetControlStates();      

    console.log("W10 Maze Sketch Setup finished.");
}


function draw() {
  
  if (gameWon) return;

  
  background(config.bgColor);

  
  if (flashWalls && millis() - flashStartTime > FLASH_DURATION) {
    flashWalls = false; 
  }

  
  handleMovement(); 

  
  constrainPlayerPosition();

  
  drawMaze();         
  drawExit();         
  drawPlayerTrail();  
  drawPlayer();       

  
  checkWinCondition();
}






function initializeDOMReferences() {
    canvasContainerDiv = select("#typography-canvas-container"); 
    canvasParentDiv = select("#typography-canvas");           
    winContentElement = select('#win-content');              

    
    if (!canvasContainerDiv || !canvasParentDiv) { console.error("Required canvas container divs not found!"); }
    if (!winContentElement) { console.error("#win-content element not found! Win screen disabled."); }
    console.log("DOM references initialized.");
}


function initializePlayer() {
     player = { x: w / 2, y: w / 2 }; 
     console.log("Player initialized.");
}


function resetControlStates() {
    gameWon = false;        
    flashWalls = false;     
    dragging = false;       
    trail = [];             
    
    moveState = { up: false, down: false, left: false, right: false };
    
    mobileSpeedX = 0;
    mobileSpeedY = 0;
    console.log("Control states reset.");
}







function drawMaze() {
    for (let cell of grid) {
        cell.show();
    }
}


function drawExit() {
    let exitCell = grid[index(MAZE_COLS - 1, MAZE_ROWS - 1)];
    if (!exitCell) return; 

    fill(0, 255, 0); 
    
    textSize(max(wallTextSize * 0.8, 10));
    textAlign(CENTER, CENTER);
    
    text("EXIT", exitCell.i * w + w / 2, exitCell.j * w + w / 2);
}


function drawPlayerTrail() {
    
    if (controlMode === 'desktop' && trail.length > 0) {
        noStroke();
        fill(255, 0, 0, 150); 
        
        for (let pos of trail) {
            ellipse(pos.x, pos.y, currentBallDiameter * 0.8);
        }
    }
}


function drawPlayer() {
    if (!player) return; 

    fill(255, 0, 0); 
    noStroke();
    
    ellipse(player.x, player.y, currentBallDiameter);
}







function constrainPlayerPosition() {
    if (!player) return;
    let halfBall = currentBallDiameter / 2;
    
    player.x = constrain(player.x, halfBall, width - halfBall);
    player.y = constrain(player.y, halfBall, height - halfBall);
}


function checkWallCollision(nx, ny) {
    if (!player) return true; 
    let currentI = floor(player.x / w); let currentJ = floor(player.y / w);
    let halfBall = currentBallDiameter / 2;

    
    if (nx - halfBall < 0 || nx + halfBall > width || ny - halfBall < 0 || ny + halfBall > height) return true;

    let currentCell = grid[index(currentI, currentJ)];
    if (!currentCell) return true; 

    
    if (nx < player.x && currentCell.walls[3]) { 
       if (nx - halfBall < currentI * w) return true;
    }
    if (nx > player.x && currentCell.walls[1]) { 
        if (nx + halfBall > (currentI + 1) * w) return true;
    }
    if (ny < player.y && currentCell.walls[0]) { 
        if (ny - halfBall < currentJ * w) return true;
    }
    if (ny > player.y && currentCell.walls[2]) { 
       if (ny + halfBall > (currentJ + 1) * w) return true;
    }
    return false; 
}


function handleMovement() {
    if (gameWon || !player) return; 

    let intendedMoveX = 0; 
    let intendedMoveY = 0; 
    const maxMobileSpeed = playerSpeed * MAX_MOBILE_SPEED_FACTOR; 

    
    if (controlMode === 'mobile') {
        
        
        if (moveState.up) {
            mobileSpeedY = max(-maxMobileSpeed, mobileSpeedY - MOBILE_ACCELERATION);
        } else if (moveState.down) {
            mobileSpeedY = min(maxMobileSpeed, mobileSpeedY + MOBILE_ACCELERATION);
        } else {
            mobileSpeedY = 0; 
        }
        
        if (moveState.left) {
            mobileSpeedX = max(-maxMobileSpeed, mobileSpeedX - MOBILE_ACCELERATION);
        } else if (moveState.right) {
            mobileSpeedX = min(maxMobileSpeed, mobileSpeedX + MOBILE_ACCELERATION);
        } else {
            mobileSpeedX = 0; 
        }
        
        intendedMoveX = mobileSpeedX;
        intendedMoveY = mobileSpeedY;

    } else {
        
        
        
        intendedMoveX = 0;
        intendedMoveY = 0;
        

        
        
        
        
        
        
    }

    
    
    
    if (intendedMoveX !== 0 && !checkWallCollision(player.x + intendedMoveX, player.y)) {
        player.x += intendedMoveX; 
    }
    
    if (intendedMoveY !== 0 && !checkWallCollision(player.x, player.y + intendedMoveY)) {
        player.y += intendedMoveY; 
    }
    
}



function checkWinCondition() {
    if (gameWon || !player) return; 

    
    let exitX = (MAZE_COLS - 0.5) * w;
    let exitY = (MAZE_ROWS - 0.5) * w;
    
    let winThreshold = w / 2; 

     
    if (dist(player.x, player.y, exitX, exitY) < winThreshold) {
        console.log("Exit reached!");
        showWinContent(); 
    }
}





function keyPressed() {
  
  
  if (gameWon) return; 

  if (keyCode === UP_ARROW) moveState.up = true;
  else if (keyCode === DOWN_ARROW) moveState.down = true;
  else if (keyCode === LEFT_ARROW) moveState.left = true;
  else if (keyCode === RIGHT_ARROW) moveState.right = true;

  
  if (controlMode === 'desktop' && dragging) {
      dragging = false;
      trail = [];
      console.log("Key pressed, drag stopped.");
  }
  
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode)) {
       if (!gameWon) return false; 
  }
}

function keyReleased() {
  
  if (keyCode === UP_ARROW) moveState.up = false;
  else if (keyCode === DOWN_ARROW) moveState.down = false;
  else if (keyCode === LEFT_ARROW) moveState.left = false;
  else if (keyCode === RIGHT_ARROW) moveState.right = false;
}

function mousePressed() {
  if (gameWon) return; 
  
  if (controlMode === 'desktop') {
      if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) { 
        if (dist(mouseX, mouseY, player.x, player.y) < currentBallDiameter / 2 + DRAG_CLICK_SENSITIVITY) {
            dragging = true;
            moveState = { up: false, down: false, left: false, right: false }; 
            trail = [{x: player.x, y: player.y}]; 
            console.log("Mouse pressed on player - starting drag.");
        }
      }
  }
}

function mouseDragged() {
    if (gameWon) { if (dragging) dragging = false; return; } 

    if (controlMode === 'desktop' && dragging) {
        let halfBall = currentBallDiameter / 2;
        
        let nextX = constrain(mouseX, halfBall, width - halfBall);
        let nextY = constrain(mouseY, halfBall, height - halfBall);

        
        let collidedX = checkWallCollision(nextX, player.y);
        let collidedY = checkWallCollision(player.x, nextY);

        if (collidedX || collidedY) {
            
            console.log("Collision detected during drag! Resetting.");
            flashWalls = true; flashStartTime = millis();
            dragging = false; 
            resetMaze();    
            return;         
        } else {
            
            player.x = nextX;
            player.y = nextY;
            
            if(trail.length === 0 || dist(player.x, player.y, trail[trail.length-1].x, trail[trail.length-1].y) > 2) {
               trail.push({ x: player.x, y: player.y });
            }
        }
    }
}

function mouseReleased() {
  
  if (controlMode === 'desktop' && dragging) {
      if (!gameWon) {
          
          console.log("Mouse released after dragging (game not won) - Resetting.");
          dragging = false;
          resetMaze();
      } else {
          
           console.log("Mouse released after dragging (game won) - Stopping drag.");
           dragging = false;
           trail = []; 
      }
  }
}

function windowResized() {
  
  canvasContainerDiv = select("#typography-canvas-container");
  canvasParentDiv = select("#typography-canvas");
  if (!canvasContainerDiv || !canvasParentDiv) return; 

  
  let newWidth = canvasParentDiv.elt.clientWidth || 400;
  let newHeight = newWidth; 

  
  if (abs(newWidth - width) > 1 || abs(newHeight - height) > 1) {
      console.log("Resizing W10 Maze canvas to:", newWidth, "x", newHeight);
      
      resizeCanvas(newWidth, newHeight);
      
      w = width / MAZE_COLS;

      
      updateDynamicSizes(newWidth); 
      positionArrowControls();

      
      
      if (!gameWon) {
        console.log("Window resized - Resetting maze.");
        resetMaze();
      } else {
          
          console.log("Window resized but game won, not resetting maze.");
          
          showWinContent(); 
      }
  }
}






function initializeMaze() {
    console.log("Initializing maze structure...");
    grid = []; stack = []; 

    
    for (let j = 0; j < MAZE_ROWS; j++) {
        for (let i = 0; i < MAZE_COLS; i++) {
            grid.push(new Cell(i, j));
        }
    }

    
    current = grid[0]; 
    current.visited = true;
    let generationComplete = false;
    while (!generationComplete) {
        let next = current.checkNeighbors(); 
        if (next) {
            next.visited = true; stack.push(current); removeWalls(current, next); current = next;
        } else if (stack.length > 0) {
            current = stack.pop(); 
        } else {
            generationComplete = true; 
        }
    }
    console.log("Maze generation complete.");
}


function showGameContent() {
     gameWon = false; 
     console.log("Showing Game Content (W10 Maze)");
     if(canvasContainerDiv) canvasContainerDiv.removeClass('hidden');
     
     
     if(winContentElement) winContentElement.removeClass('visible').addClass('hidden');
}


function showWinContent() {
    if (gameWon || !winContentElement) return; 
    gameWon = true; 
    console.log("Showing Win Content (W10 Maze)");
    if(canvasContainerDiv) canvasContainerDiv.addClass('hidden');
    if(arrowButtonContainer) arrowButtonContainer.addClass('hidden'); 
    if(winContentElement) winContentElement.removeClass('hidden').addClass('visible');
}


function resetMaze() {
  console.log("Resetting W10 maze...");
  
  showGameContent();
  
  flashWalls = true; flashStartTime = millis();
  
  initializeMaze();
  
  initializePlayer();
  
  resetControlStates();
  
  if (arrowButtonContainer) {
      arrowButtonContainer.removeClass('hidden');
  }
}






function setupArrowControls() {
    arrowButtonContainer = select('#arrow-controls');
    if (!arrowButtonContainer) { 
        arrowButtonContainer = createDiv(''); arrowButtonContainer.id('arrow-controls');
        if (canvasContainerDiv) { arrowButtonContainer.parent(canvasContainerDiv); console.log("Arrow controls created and parented."); }
        else { console.warn("Cannot parent arrow controls, canvasContainerDiv not found."); document.body.appendChild(arrowButtonContainer.elt); } 

        
        arrowButtonContainer.style('text-align', 'center');
        arrowButtonContainer.style('position', 'relative'); 
        arrowButtonContainer.style('padding-top', '10px'); 

        
        createArrowButton('↑', 'up'); 
        let middleRow = createDiv(''); middleRow.parent(arrowButtonContainer); middleRow.addClass('middle-arrow-row'); 
        createArrowButton('←', 'left', middleRow); 
        createArrowButton('→', 'right', middleRow); 
        createArrowButton('↓', 'down'); 

        
        arrowButtonContainer.addClass('hidden');

    } else { console.log("Arrow controls container already exists."); }
    
    positionArrowControls();
    
    
}


function createArrowButton(label, direction, parentElement = arrowButtonContainer) {
     let button = createButton(label);
     button.parent(parentElement);
     button.addClass('arrow-button'); 
     addArrowButtonListeners(button, direction); 
     return button;
}


function addArrowButtonListeners(button, direction) {
    button.elt.addEventListener('mousedown', () => moveState[direction] = true);
    button.elt.addEventListener('mouseup', () => moveState[direction] = false);
    button.elt.addEventListener('mouseout', () => moveState[direction] = false); 
    button.elt.addEventListener('touchstart', (e) => { e.preventDefault(); moveState[direction] = true; }, { passive: false });
    button.elt.addEventListener('touchend', () => moveState[direction] = false);
    button.elt.addEventListener('touchcancel', () => moveState[direction] = false); 
}


function positionArrowControls() {
    if (arrowButtonContainer && canvasContainerDiv) {
        
        
        if (canvasParentDiv && canvasParentDiv.elt) {
             arrowButtonContainer.style('width', `${canvasParentDiv.width}px`);
             console.log("Arrow controls positioned/sized.");
        } else {
             console.warn("Cannot size arrow controls, canvasParentDiv not found or has no width.");
        }
    }
}






window.addEventListener("keydown", function(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        
        if (!gameWon) {
             e.preventDefault(); 
        }
    }
}, false); 