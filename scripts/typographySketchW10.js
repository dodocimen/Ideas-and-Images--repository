/**************************************************************
 * Interactive Maze Made Only with Words (Hybrid Control Version)
 * SCRIPT FOR W10 - Refactored + Mobile Acceleration
 *
 * - Desktop (> MOBILE_BREAKPOINT): Drag ball; resets on release OR WALL HIT. Arrow keys work (constant speed).
 * - Mobile (<= MOBILE_BREAKPOINT): Tap arrows. HOLDING arrows gradually INCREASES speed. Physical keys work.
 * - Adjusts size dynamically.
 * - Win screen reveals article/image section.
 * - Code reviewed, cleaned, commented, and optimized for readability.
 **************************************************************/

// --- Configuration & Constants ---
const MOBILE_BREAKPOINT = 390; // Updated Breakpoint
const MAZE_COLS = 10;
const MAZE_ROWS = 10;
const FLASH_DURATION = 500;    // ms for wall flash effect
const PLAYER_SPEED_FACTOR = 15; // Lower number = faster BASE speed relative to cell size
const MIN_PLAYER_SPEED = 1.5;
const DRAG_CLICK_SENSITIVITY = 10; // Extra pixels around ball for drag start
// *** NEW: Mobile Acceleration Constants ***
const MAX_MOBILE_SPEED_FACTOR = 20; // Max speed = factor * base playerSpeed
const MOBILE_ACCELERATION = 5;   // Speed increase per frame when holding button

const config = {
  letterSpacing: 0,             // p5 text setting
  bgColor: "#0300BF",          // Canvas background
  wallWords: { words: ["WICKED", "IS GOOD"] }, // Words for walls
  wallOffsetFactor: 0.15,      // % of cell width for wall offset
  // Dynamic Sizes (defaults for desktop)
  defaultWallTextSize: 25,
  defaultBallDiameter: 15,
  // Mobile Sizes
  mobileWallTextSize: 15,
  mobileBallDiameter: 10,
};

// --- Maze State ---
let w; // Calculated cell width/height
let grid = [];
let stack = []; // Stack for DFS maze generation
let current; // Current cell during maze generation

// --- Player State ---
let player; // { x, y } position object
let playerSpeed; // Base speed calculated from cell size
// *** NEW: Mobile Speed State ***
let mobileSpeedX = 0; // Current horizontal speed for mobile controls
let mobileSpeedY = 0; // Current vertical speed for mobile controls

// --- Control State ---
let controlMode = 'desktop'; // 'desktop' or 'mobile'
let moveState = { up: false, down: false, left: false, right: false }; // Keyboard/button state
let dragging = false; // Mouse drag state
let trail = []; // Player trail points during drag

// --- Effect State ---
let flashWalls = false; // Whether walls should flash red (on reset)
let flashStartTime = 0;

// --- Game State ---
let gameWon = false;

// --- Assets ---
let wallFont;

// --- DOM Element References ---
let arrowButtonContainer; // Div holding arrow buttons
let canvasContainerDiv;   // The outer div wrapping the canvas area
let canvasParentDiv;      // The specific div the p5 canvas is attached to
let winContentElement;    // The div shown on game win
let p5Canvas;             // The p5 canvas element itself

//--------------------------------------------------
// Helper Functions
//--------------------------------------------------

/**
 * Updates dynamic sizes (text, ball) and control mode based on canvas width.
 * Shows/hides arrow controls accordingly. Also calculates base playerSpeed.
 * @param {number} currentWidth The current width of the canvas.
 */
// Using the version that forces buttons visible for debugging
function updateDynamicSizes(currentWidth) {
  // Determine sizes based on breakpoint
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

  // *** MODIFICATION: Always make buttons visible for debugging ***
  if (arrowButtonContainer) {
      arrowButtonContainer.removeClass('hidden');
      console.log("Arrow buttons forced visible for debugging.");
  } else {
      console.log("updateDynamicSizes: arrowButtonContainer not found yet.");
      // It might not exist during the very first call in setup if DOM isn't ready,
      // but setupArrowControls should handle visibility later if it creates it.
  }
  // *** END MODIFICATION ***

  // Calculate base player speed (used directly by desktop, basis for mobile max speed)
  playerSpeed = max(w / PLAYER_SPEED_FACTOR, MIN_PLAYER_SPEED);
  console.log(`Sizes Updated: Text=${wallTextSize}, Ball=${currentBallDiameter}, BaseSpeed=${playerSpeed.toFixed(2)}`);
}


/**
 * Calculates the 1D array index for a grid cell. Returns -1 if out of bounds.
 */
function index(i, j) {
  if (i < 0 || j < 0 || i >= MAZE_COLS || j >= MAZE_ROWS) return -1;
  return i + j * MAZE_COLS;
}

/**
 * Removes the wall between two adjacent cells.
 */
function removeWalls(a, b) {
  let x = a.i - b.i; if (x === 1) { a.walls[3] = false; b.walls[1] = false; } else if (x === -1) { a.walls[1] = false; b.walls[3] = false; }
  let y = a.j - b.j; if (y === 1) { a.walls[0] = false; b.walls[2] = false; } else if (y === -1) { a.walls[2] = false; b.walls[0] = false; }
}

//--------------------------------------------------
// Cell Class
//--------------------------------------------------
class Cell {
  constructor(i, j) { this.i = i; this.j = j; this.walls = [true, true, true, true]; this.visited = false; this.wallWords = { top: random(config.wallWords.words), right: random(config.wallWords.words), bottom: random(config.wallWords.words), left: random(config.wallWords.words) }; }
  show() { let x = this.i * w; let y = this.j * w; let wallOffset = w * config.wallOffsetFactor; noStroke(); textSize(wallTextSize); textAlign(CENTER, CENTER); push(); textFont(wallFont); if (flashWalls) fill(255, 0, 0); else fill(255); if (this.walls[0]) { push(); translate(x + w / 2, y + wallOffset); text(this.wallWords.top, 0, 0); pop(); } if (this.walls[1]) { push(); translate(x + w - wallOffset, y + w / 2); rotate(radians(-90)); text(this.wallWords.right, 0, 0); pop(); } if (this.walls[2]) { push(); translate(x + w / 2, y + w - wallOffset); text(this.wallWords.bottom, 0, 0); pop(); } if (this.walls[3]) { push(); translate(x + wallOffset, y + w / 2); rotate(radians(90)); text(this.wallWords.left, 0, 0); pop(); } pop(); }
  checkNeighbors() { let neighbors = []; let top = grid[index(this.i, this.j - 1)]; let right = grid[index(this.i + 1, this.j)]; let bottom = grid[index(this.i, this.j + 1)]; let left = grid[index(this.i - 1, this.j)]; if (top && !top.visited) neighbors.push(top); if (right && !right.visited) neighbors.push(right); if (bottom && !bottom.visited) neighbors.push(bottom); if (left && !left.visited) neighbors.push(left); if (neighbors.length > 0) return random(neighbors); else return undefined; }
}

//--------------------------------------------------
// p5.js Core Functions
//--------------------------------------------------

function preload() {
  // Ensure the font path is correct relative to your HTML file
  wallFont = loadFont("./fonts/RoadRage-Regular.ttf");
  console.log("Font loaded.");
}

function setup() {
    console.log("W10 Maze Sketch Setup started.");
    // Initialize references to DOM elements needed by the sketch
    initializeDOMReferences();

    // Create the main p5 canvas, sizing it to its container
    let canvasWidth = canvasParentDiv.elt.clientWidth || 400; // Use container width or a default
    let canvasHeight = canvasWidth; // Maintain a 1:1 aspect ratio
    p5Canvas = createCanvas(canvasWidth, canvasHeight);
    p5Canvas.parent(canvasParentDiv); // Attach the canvas to the designated div

    console.log(`W10 Maze Canvas created: ${width}x${height}`);
    // Calculate the width/height of each maze cell based on the canvas size
    w = width / MAZE_COLS;

    // Set up mobile arrow button controls
    setupArrowControls(); // This creates the #arrow-controls div

    // Initialize dynamic sizes, game state, maze, player, and control flags
    updateDynamicSizes(width); // Sets sizes, speed, control mode, AND FORCES BUTTONS VISIBLE
    showGameContent();         // Ensures the game view is visible initially
    initializeMaze();          // Generates the maze data
    initializePlayer();        // Places the player at the start
    resetControlStates();      // Resets flags (gameWon, dragging) and mobile speeds

    console.log("W10 Maze Sketch Setup finished.");
}


function draw() {
  // If the game has been won, stop the draw loop for the game itself
  if (gameWon) return;

  // Clear the canvas with the background color
  background(config.bgColor);

  // If the wall flash effect is active, check if its duration has passed
  if (flashWalls && millis() - flashStartTime > FLASH_DURATION) {
    flashWalls = false; // Turn off the flash effect
  }

  // Update the player's position based on controls (includes mobile acceleration)
  handleMovement(); // <= THIS FUNCTION IS MODIFIED BELOW

  // Keep the player within the canvas boundaries
  constrainPlayerPosition();

  // Draw all the visual elements of the game
  drawMaze();         // Draw the maze walls
  drawExit();         // Draw the "EXIT" text
  drawPlayerTrail();  // Draw the trail left by dragging (desktop only)
  drawPlayer();       // Draw the player's ball

  // Check if the player has reached the exit this frame
  checkWinCondition();
}

//--------------------------------------------------
// Initialization Helpers (Called from Setup)
//--------------------------------------------------

/** Selects and stores references to essential HTML elements. */
function initializeDOMReferences() {
    canvasContainerDiv = select("#typography-canvas-container"); // The outer wrapper
    canvasParentDiv = select("#typography-canvas");           // The div canvas goes INTO
    winContentElement = select('#win-content');              // The win screen div

    // Log errors if essential elements are not found in the HTML
    if (!canvasContainerDiv || !canvasParentDiv) { console.error("Required canvas container divs not found!"); }
    if (!winContentElement) { console.error("#win-content element not found! Win screen disabled."); }
    console.log("DOM references initialized.");
}

/** Sets the player's initial position. */
function initializePlayer() {
     player = { x: w / 2, y: w / 2 }; // Start at center of the top-left cell
     console.log("Player initialized.");
}

/** Resets control flags and mobile speeds to their default state. */
function resetControlStates() {
    gameWon = false;        // Game is not won
    flashWalls = false;     // Walls are not flashing
    dragging = false;       // Player is not being dragged
    trail = [];             // Clear the drag trail
    // Reset keyboard/button input states
    moveState = { up: false, down: false, left: false, right: false };
    // Reset mobile acceleration speeds
    mobileSpeedX = 0;
    mobileSpeedY = 0;
    console.log("Control states reset.");
}


//--------------------------------------------------
// Drawing Helpers (Called from Draw)
//--------------------------------------------------

/** Draws all cells in the maze grid by calling their show() method. */
function drawMaze() {
    for (let cell of grid) {
        cell.show();
    }
}

/** Draws the "EXIT" text indicator in the bottom-right cell. */
function drawExit() {
    let exitCell = grid[index(MAZE_COLS - 1, MAZE_ROWS - 1)];
    if (!exitCell) return; // Safety check

    fill(0, 255, 0); // Green color for exit text
    // Calculate text size relative to wall text size, with a minimum
    textSize(max(wallTextSize * 0.8, 10));
    textAlign(CENTER, CENTER);
    // Position text in the center of the exit cell
    text("EXIT", exitCell.i * w + w / 2, exitCell.j * w + w / 2);
}

/** Draws the player's visual trail during dragging (desktop mode only). */
function drawPlayerTrail() {
    // Only draw if in desktop mode and the trail array has points
    if (controlMode === 'desktop' && trail.length > 0) {
        noStroke();
        fill(255, 0, 0, 150); // Semi-transparent red for trail
        // Draw smaller ellipses at previous trail positions
        for (let pos of trail) {
            ellipse(pos.x, pos.y, currentBallDiameter * 0.8);
        }
    }
}

/** Draws the player character (red ball) at its current position. */
function drawPlayer() {
    if (!player) return; // Don't draw if player object doesn't exist

    fill(255, 0, 0); // Red color for player
    noStroke();
    // Draw the player ball
    ellipse(player.x, player.y, currentBallDiameter);
}


//--------------------------------------------------
// Player Movement & Game Logic
//--------------------------------------------------

/** Ensures the player's position stays within the canvas boundaries. */
function constrainPlayerPosition() {
    if (!player) return;
    let halfBall = currentBallDiameter / 2;
    // Use p5.constrain to limit x and y coordinates
    player.x = constrain(player.x, halfBall, width - halfBall);
    player.y = constrain(player.y, halfBall, height - halfBall);
}

/**
 * Checks if the player's next potential position (nx, ny) collides with a wall.
 * Uses the current cell's walls based on movement direction.
 */
function checkWallCollision(nx, ny) {
    if (!player) return true; // Treat as collision if player doesn't exist
    let currentI = floor(player.x / w); let currentJ = floor(player.y / w);
    let halfBall = currentBallDiameter / 2;

    // Check canvas boundary collision
    if (nx - halfBall < 0 || nx + halfBall > width || ny - halfBall < 0 || ny + halfBall > height) return true;

    let currentCell = grid[index(currentI, currentJ)];
    if (!currentCell) return true; // Player outside grid - collision

    // Check collision with walls of the CURRENT cell based on movement direction
    if (nx < player.x && currentCell.walls[3]) { // Moving left into left wall?
       if (nx - halfBall < currentI * w) return true;
    }
    if (nx > player.x && currentCell.walls[1]) { // Moving right into right wall?
        if (nx + halfBall > (currentI + 1) * w) return true;
    }
    if (ny < player.y && currentCell.walls[0]) { // Moving up into top wall?
        if (ny - halfBall < currentJ * w) return true;
    }
    if (ny > player.y && currentCell.walls[2]) { // Moving down into bottom wall?
       if (ny + halfBall > (currentJ + 1) * w) return true;
    }
    return false; // No collision detected
}

/**
 * Updates player position based on active controls.
 * Handles mobile acceleration and desktop constant speed separately.
 * MODIFIED TO DISABLE DESKTOP KEYBOARD ARROWS
 */
function handleMovement() {
    if (gameWon || !player) return; // Ignore if game won or player missing

    let intendedMoveX = 0; // Net movement in X for this frame
    let intendedMoveY = 0; // Net movement in Y for this frame
    const maxMobileSpeed = playerSpeed * MAX_MOBILE_SPEED_FACTOR; // Max speed for mobile

    // --- Determine Movement Based on Control Mode ---
    if (controlMode === 'mobile') {
        // --- Mobile Mode: Gradual Acceleration ---
        // Update Vertical Speed (mobileSpeedY)
        if (moveState.up) {
            mobileSpeedY = max(-maxMobileSpeed, mobileSpeedY - MOBILE_ACCELERATION);
        } else if (moveState.down) {
            mobileSpeedY = min(maxMobileSpeed, mobileSpeedY + MOBILE_ACCELERATION);
        } else {
            mobileSpeedY = 0; // Stop vertical movement if neither button is pressed
        }
        // Update Horizontal Speed (mobileSpeedX)
        if (moveState.left) {
            mobileSpeedX = max(-maxMobileSpeed, mobileSpeedX - MOBILE_ACCELERATION);
        } else if (moveState.right) {
            mobileSpeedX = min(maxMobileSpeed, mobileSpeedX + MOBILE_ACCELERATION);
        } else {
            mobileSpeedX = 0; // Stop horizontal movement if neither button is pressed
        }
        // Set the intended movement for this frame based on calculated mobile speeds
        intendedMoveX = mobileSpeedX;
        intendedMoveY = mobileSpeedY;

    } else {
        // --- Desktop Mode: ---
        // *** MODIFICATION: Ignore keyboard arrow key input (moveState) ***
        // Desktop movement is now ONLY handled by mouseDragged()
        intendedMoveX = 0;
        intendedMoveY = 0;
        // *** END MODIFICATION ***

        // --- Original Desktop Code (Now Disabled) ---
        // if (moveState.up)    intendedMoveY = -playerSpeed;
        // if (moveState.down)  intendedMoveY = playerSpeed;
        // if (moveState.left)  intendedMoveX = -playerSpeed;
        // if (moveState.right) intendedMoveX = playerSpeed;
        // --- End Original Desktop Code ---
    }

    // --- Apply Movement & Collision Check (Common logic for both modes) ---
    // Only apply movement if it's non-zero (relevant for mobile now)
    // Check X-direction movement against walls
    if (intendedMoveX !== 0 && !checkWallCollision(player.x + intendedMoveX, player.y)) {
        player.x += intendedMoveX; // Allow move if no collision
    }
    // Check Y-direction movement against walls (using potentially updated X position)
    if (intendedMoveY !== 0 && !checkWallCollision(player.x, player.y + intendedMoveY)) {
        player.y += intendedMoveY; // Allow move if no collision
    }
    // Final position constraining (keeping player within bounds) happens in constrainPlayerPosition() called from draw()
}


/** Checks if the player has reached the exit cell and triggers the win state. */
function checkWinCondition() {
    if (gameWon || !player) return; // Ignore if already won or no player

    // Calculate the center coordinates of the exit cell (bottom-right)
    let exitX = (MAZE_COLS - 0.5) * w;
    let exitY = (MAZE_ROWS - 0.5) * w;
    // Define the 'win zone' radius within the exit cell
    let winThreshold = w / 2; // Must reach the center half of the cell

     // Check distance between player center and exit center
    if (dist(player.x, player.y, exitX, exitY) < winThreshold) {
        console.log("Exit reached!");
        showWinContent(); // Switch to the win screen view
    }
}

//--------------------------------------------------
// Event Handlers
//--------------------------------------------------

function keyPressed() {
  // Only update moveState if in mobile mode or for non-arrow keys if needed later
  // OR keep simple and let handleMovement filter it out for desktop
  if (gameWon) return; // Ignore input if game won

  if (keyCode === UP_ARROW) moveState.up = true;
  else if (keyCode === DOWN_ARROW) moveState.down = true;
  else if (keyCode === LEFT_ARROW) moveState.left = true;
  else if (keyCode === RIGHT_ARROW) moveState.right = true;

  // Stop dragging if a key is pressed (still useful)
  if (controlMode === 'desktop' && dragging) {
      dragging = false;
      trail = [];
      console.log("Key pressed, drag stopped.");
  }
  // Prevent browser scroll on arrow key press (still useful)
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode)) {
       if (!gameWon) return false; // Prevent scroll only if game is active
  }
}

function keyReleased() {
  // Update move state when keys are released
  if (keyCode === UP_ARROW) moveState.up = false;
  else if (keyCode === DOWN_ARROW) moveState.down = false;
  else if (keyCode === LEFT_ARROW) moveState.left = false;
  else if (keyCode === RIGHT_ARROW) moveState.right = false;
}

function mousePressed() {
  if (gameWon) return; // Ignore input if game won
  // Start dragging only in desktop mode if close enough to the player
  if (controlMode === 'desktop') {
      if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) { // Check if inside canvas
        if (dist(mouseX, mouseY, player.x, player.y) < currentBallDiameter / 2 + DRAG_CLICK_SENSITIVITY) {
            dragging = true;
            moveState = { up: false, down: false, left: false, right: false }; // Stop any residual key movement state
            trail = [{x: player.x, y: player.y}]; // Start trail
            console.log("Mouse pressed on player - starting drag.");
        }
      }
  }
}

function mouseDragged() {
    if (gameWon) { if (dragging) dragging = false; return; } // Ignore if won

    if (controlMode === 'desktop' && dragging) {
        let halfBall = currentBallDiameter / 2;
        // Target position is mouse position, constrained within canvas
        let nextX = constrain(mouseX, halfBall, width - halfBall);
        let nextY = constrain(mouseY, halfBall, height - halfBall);

        // Check for collision *before* moving player
        let collidedX = checkWallCollision(nextX, player.y);
        let collidedY = checkWallCollision(player.x, nextY);

        if (collidedX || collidedY) {
            // Collision detected: Reset the game
            console.log("Collision detected during drag! Resetting.");
            flashWalls = true; flashStartTime = millis();
            dragging = false; // Stop the drag
            resetMaze();    // Reset game state
            return;         // Exit function for this frame
        } else {
            // No collision: Update player position and trail
            player.x = nextX;
            player.y = nextY;
            // Add point to trail only if moved a bit, prevents dense clusters
            if(trail.length === 0 || dist(player.x, player.y, trail[trail.length-1].x, trail[trail.length-1].y) > 2) {
               trail.push({ x: player.x, y: player.y });
            }
        }
    }
}

function mouseReleased() {
  // Handle mouse release only in desktop mode when dragging was active
  if (controlMode === 'desktop' && dragging) {
      if (!gameWon) {
          // If game wasn't won, release resets the maze
          console.log("Mouse released after dragging (game not won) - Resetting.");
          dragging = false;
          resetMaze();
      } else {
          // If game was won, release just stops the drag
           console.log("Mouse released after dragging (game won) - Stopping drag.");
           dragging = false;
           trail = []; // Clear visual trail
      }
  }
}

function windowResized() {
  // Re-select container elements
  canvasContainerDiv = select("#typography-canvas-container");
  canvasParentDiv = select("#typography-canvas");
  if (!canvasContainerDiv || !canvasParentDiv) return; // Exit if containers not found

  // Get new dimensions from the container div the canvas sits within
  let newWidth = canvasParentDiv.elt.clientWidth || 400;
  let newHeight = newWidth; // Maintain 1:1 aspect ratio

  // Only resize if dimensions actually changed significantly to avoid unnecessary resets
  if (abs(newWidth - width) > 1 || abs(newHeight - height) > 1) {
      console.log("Resizing W10 Maze canvas to:", newWidth, "x", newHeight);
      // Resize the p5 canvas
      resizeCanvas(newWidth, newHeight);
      // Recalculate cell width based on new canvas width
      w = width / MAZE_COLS;

      // Update dynamic sizes and reposition controls
      updateDynamicSizes(newWidth); // THIS WILL NOW ALWAYS SHOW BUTTONS
      positionArrowControls();

      // --- Conditional Reset on Resize ---
      // Only reset the maze if the game hasn't been won yet
      if (!gameWon) {
        console.log("Window resized - Resetting maze.");
        resetMaze();
      } else {
          // If game was already won, don't reset, keep showing the win screen
          console.log("Window resized but game won, not resetting maze.");
          // Ensure win screen visibility is maintained if necessary (though hide/show logic handles this)
          showWinContent(); // Re-assert win screen state
      }
  }
}

//--------------------------------------------------
// Game Management Functions
//--------------------------------------------------

/** Generates the maze data using a Depth First Search algorithm. */
function initializeMaze() {
    console.log("Initializing maze structure...");
    grid = []; stack = []; // Reset grid and stack

    // Create grid of new Cell objects
    for (let j = 0; j < MAZE_ROWS; j++) {
        for (let i = 0; i < MAZE_COLS; i++) {
            grid.push(new Cell(i, j));
        }
    }

    // DFS Algorithm
    current = grid[0]; // Start at top-left
    current.visited = true;
    let generationComplete = false;
    while (!generationComplete) {
        let next = current.checkNeighbors(); // Find random unvisited neighbor
        if (next) {
            next.visited = true; stack.push(current); removeWalls(current, next); current = next;
        } else if (stack.length > 0) {
            current = stack.pop(); // Backtrack
        } else {
            generationComplete = true; // Done
        }
    }
    console.log("Maze generation complete.");
}

/** Makes the game content (canvas, controls) visible and hides the win screen. */
function showGameContent() {
     gameWon = false; // Set game state to active
     console.log("Showing Game Content (W10 Maze)");
     if(canvasContainerDiv) canvasContainerDiv.removeClass('hidden');
     // Arrow container visibility now handled by updateDynamicSizes modification (always visible)
     // updateDynamicSizes will ensure the container is shown based on its logic
     if(winContentElement) winContentElement.removeClass('visible').addClass('hidden');
}

/** Makes the win screen visible and hides the game content. */
function showWinContent() {
    if (gameWon || !winContentElement) return; // Prevent multiple calls or if element missing
    gameWon = true; // Set game state to won
    console.log("Showing Win Content (W10 Maze)");
    if(canvasContainerDiv) canvasContainerDiv.addClass('hidden');
    if(arrowButtonContainer) arrowButtonContainer.addClass('hidden'); // Always hide arrows on win
    if(winContentElement) winContentElement.removeClass('hidden').addClass('visible');
}

/** Resets the game to its initial state. */
function resetMaze() {
  console.log("Resetting W10 maze...");
  // Ensure game UI is visible (this also sets gameWon = false)
  showGameContent();
  // Trigger visual flash effect for walls
  flashWalls = true; flashStartTime = millis();
  // Regenerate maze structure
  initializeMaze();
  // Reset player position
  initializePlayer();
  // Reset all control flags and mobile speeds
  resetControlStates();
  // Ensure buttons are visible after reset (due to modification in updateDynamicSizes)
  if (arrowButtonContainer) {
      arrowButtonContainer.removeClass('hidden');
  }
}

//--------------------------------------------------
// Arrow Controls Setup/Positioning (Mobile)
//--------------------------------------------------

/** Creates the arrow button DOM elements and attaches listeners if they don't exist. */
function setupArrowControls() {
    arrowButtonContainer = select('#arrow-controls');
    if (!arrowButtonContainer) { // Only create if it doesn't exist
        arrowButtonContainer = createDiv(''); arrowButtonContainer.id('arrow-controls');
        if (canvasContainerDiv) { arrowButtonContainer.parent(canvasContainerDiv); console.log("Arrow controls created and parented."); }
        else { console.warn("Cannot parent arrow controls, canvasContainerDiv not found."); document.body.appendChild(arrowButtonContainer.elt); } // Fallback

        // Basic CSS styling via JS (prefer CSS file)
        arrowButtonContainer.style('text-align', 'center');
        arrowButtonContainer.style('position', 'relative'); // Layout within container
        arrowButtonContainer.style('padding-top', '10px'); // Space below canvas

        // Create Buttons using helper
        createArrowButton('↑', 'up'); // Up
        let middleRow = createDiv(''); middleRow.parent(arrowButtonContainer); middleRow.addClass('middle-arrow-row'); // For L/R layout
        createArrowButton('←', 'left', middleRow); // Left
        createArrowButton('→', 'right', middleRow); // Right
        createArrowButton('↓', 'down'); // Down

        // Initially hide it; updateDynamicSizes will show if needed (or forced)
        arrowButtonContainer.addClass('hidden');

    } else { console.log("Arrow controls container already exists."); }
    // Ensure correct initial position/size
    positionArrowControls();
    // Ensure visibility based on the (modified) updateDynamicSizes logic
    // updateDynamicSizes(width); // Called later in setup()
}

/** Helper function to create a single arrow button, add classes and listeners. */
function createArrowButton(label, direction, parentElement = arrowButtonContainer) {
     let button = createButton(label);
     button.parent(parentElement);
     button.addClass('arrow-button'); // For CSS styling
     addArrowButtonListeners(button, direction); // Attach events
     return button;
}

/** Attaches standard mouse and touch event listeners to an arrow button. */
function addArrowButtonListeners(button, direction) {
    button.elt.addEventListener('mousedown', () => moveState[direction] = true);
    button.elt.addEventListener('mouseup', () => moveState[direction] = false);
    button.elt.addEventListener('mouseout', () => moveState[direction] = false); // Stop if mouse leaves button while pressed
    button.elt.addEventListener('touchstart', (e) => { e.preventDefault(); moveState[direction] = true; }, { passive: false });
    button.elt.addEventListener('touchend', () => moveState[direction] = false);
    button.elt.addEventListener('touchcancel', () => moveState[direction] = false); // Stop if touch is interrupted
}

/** Adjusts the arrow controls container (e.g., width) to match the canvas. */
function positionArrowControls() {
    if (arrowButtonContainer && canvasContainerDiv) {
        // Match the width of the canvas for alignment
        // Use canvasParentDiv width as it dictates canvas size
        if (canvasParentDiv && canvasParentDiv.elt) {
             arrowButtonContainer.style('width', `${canvasParentDiv.width}px`);
             console.log("Arrow controls positioned/sized.");
        } else {
             console.warn("Cannot size arrow controls, canvasParentDiv not found or has no width.");
        }
    }
}

//--------------------------------------------------
// Global Event Listener
//--------------------------------------------------

// Prevent default browser scrolling behavior when arrow keys are pressed
window.addEventListener("keydown", function(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        // Only prevent default if the game isn't won (allow scrolling on win screen)
        if (!gameWon) {
             e.preventDefault(); // Stop browser from scrolling page
        }
    }
}, false); // Use bubble phase