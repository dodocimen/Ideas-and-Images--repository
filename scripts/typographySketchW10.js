/**************************************************************
 * Interactive Maze Made Only with Words (Drag Ball Version with Win Glitch)
 * 
 * - Maze is generated using recursive backtracking.
 * - Each cell’s walls are drawn with words in a custom wall font.
 * - The player is a small ball that leaves a trail while dragged.
 * - Releasing the ball or touching a wall resets the maze.
 * - When resetting, the walls flash red briefly.
 * - Upon reaching the exit, the screen turns black and a glitching
 *   "YOU WIN!" text (in a custom win font) is displayed.
 * - A scoreboard in the top-right corner tracks the number of resets.
 *   Every 5 resets the text becomes slightly more red.
 *   The score is stored in local memory so it persists across sessions.
 **************************************************************/

// Maze parameters.
let cols = 10;         // number of columns
let rows = 10;         // number of rows
let w;                 // cell width (and height)
let grid = [];         // array of cells
let stack = [];        // stack for maze generation
let current;           // current cell for maze generation

// Player & trail.
let player;            // player's position {x, y}
let ballDiameter = 15; // diameter of the player ball
let dragging = false;  // whether the ball is being dragged
let trail = [];        // array to store previous positions for the trail

// Flash parameters for reset effect.
let flashWalls = false;
let flashStartTime = 0;
let flashDuration = 500;  // flash red for 500 ms

// Custom fonts.
let wallFont;   // for drawing wall words
let winFont;    // for the winning "YOU WIN!" text

// Game state.
let gameWon = false;

// Scoreboard variables.
let resetCount = 0;   // count of resets/attempts
let scoreboard;       // DOM element for the scoreboard

// Glitch effect & other configuration.
const config = {
  canvasWidth: 600,
  canvasHeight: 600,
  letterSpacing: 0,
  bgColor: "#1E1E1E",
  wallWords: {
    words: ["WICKED", "IS GOOD"],
  },
  collisionThreshold: 15,
  glitch: {
    intensity: 5,                // maximum offset in pixels for glitch layers
    layers: 3,                   // number of glitch layers to draw
    colorOffsets: ["#FF0000", "#00FF00", "#0000FF"], // colors for glitch layers
    textSize: 50                 // base text size for win screen
  }
};

//
// Collision helper: distance from a point to a line segment.
//
function distToSegment(px, py, x1, y1, x2, y2) {
  let l2 = sq(x2 - x1) + sq(y2 - y1);
  if (l2 === 0) return dist(px, py, x1, y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = constrain(t, 0, 1);
  let projX = x1 + t * (x2 - x1);
  let projY = y1 + t * (y2 - y1);
  return dist(px, py, projX, projY);
}

//
// Returns index in grid for cell (i, j) or -1 if out-of-bounds.
//
function index(i, j) {
  if (i < 0 || j < 0 || i >= cols || j >= rows) return -1;
  return i + j * cols;
}

//
// Cell class: each cell has 4 walls and a visited flag.
// Each wall is drawn with a randomly chosen wall word.
//
class Cell {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.walls = [true, true, true, true];  // [top, right, bottom, left]
    this.visited = false;
    this.wallWords = {
      top: random(config.wallWords.words),
      right: random(config.wallWords.words),
      bottom: random(config.wallWords.words),
      left: random(config.wallWords.words)
    };
  }
  
  // Draw the walls using the custom wall font.
  show() {
    let x = this.i * w;
    let y = this.j * w;
    
    noStroke();
    textSize(25);
    textAlign(CENTER, CENTER);
    
    push();
    textFont(wallFont);
    // If flashing, fill red; otherwise, white.
    if (flashWalls) fill(255, 0, 0);
    else fill(255);
    
    // Top wall.
    if (this.walls[0]) {
      push();
      translate(x + w/2, y + 8);
      text(this.wallWords.top, 0, 0);
      pop();
    }
    // Right wall.
    if (this.walls[1]) {
      push();
      translate(x + w - 8, y + w/2);
      rotate(radians(-90));
      text(this.wallWords.right, 0, 0);
      pop();
    }
    // Bottom wall.
    if (this.walls[2]) {
      push();
      translate(x + w/2, y + w - 8);
      text(this.wallWords.bottom, 0, 0);
      pop();
    }
    // Left wall.
    if (this.walls[3]) {
      push();
      translate(x + 8, y + w/2);
      rotate(radians(90));
      text(this.wallWords.left, 0, 0);
      pop();
    }
    pop();
  }
  
  // Check for unvisited neighbors (for maze generation).
  checkNeighbors() {
    let neighbors = [];
    let top    = grid[index(this.i, this.j - 1)];
    let right  = grid[index(this.i + 1, this.j)];
    let bottom = grid[index(this.i, this.j + 1)];
    let left   = grid[index(this.i - 1, this.j)];
    
    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom);
    if (left && !left.visited) neighbors.push(left);
    
    if (neighbors.length > 0) return random(neighbors);
    else return undefined;
  }
}

//
// Remove walls between two adjacent cells.
//
function removeWalls(a, b) {
  let x = a.i - b.i;
  if (x === 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x === -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }
  let y = a.j - b.j;
  if (y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

//
// Preload custom fonts: wallFont for walls, winFont for the winning text.
//
function preload() {
  wallFont = loadFont("./fonts/RoadRage-Regular.ttf");
  winFont = loadFont("./fonts/FrederickatheGreat-Regular.ttf");
}

//
// Setup: create canvas, grid, generate maze, initialize player, trail, and scoreboard.
//
function setup() {
  // Create the canvas and store its reference in 'cnv'
  let cnv = createCanvas(config.canvasWidth, config.canvasHeight);

  w = width / cols;
  
  // Retrieve reset count from local storage if available.
  if (localStorage.getItem("mazeResetCount") !== null) {
    resetCount = parseInt(localStorage.getItem("mazeResetCount"));
  } else {
    resetCount = 0;
  }
  
  // Create and style the scoreboard div.
  scoreboard = createDiv("Attempts: " + resetCount);
  scoreboard.style("position", "absolute");
  scoreboard.style("right", "28vw");
  scoreboard.style("top", "520px");
  scoreboard.style("font-size", "24px");
  scoreboard.style("color", "#FFFFFF"); // starting color is white
  
  // Create grid.
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      grid.push(new Cell(i, j));
    }
  }
  
  // --- Maze Generation (Recursive Backtracking) ---
  current = grid[0];
  current.visited = true;
  while (true) {
    let next = current.checkNeighbors();
    if (next) {
      next.visited = true;
      stack.push(current);
      removeWalls(current, next);
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else {
      break;
    }
  }
  
  // Initialize player ball at the starting cell (center of top-left).
  player = { x: w / 2, y: w / 2 };
  trail = [];
}


//
// Draw: render maze, trail, player ball, check collisions/win, or show win screen.
//
function draw() {
  if (gameWon) {
    drawWinScreen();
    return;
  }
  
  background("#0300BF");
  
  // If flash effect is active, check time.
  if (flashWalls && millis() - flashStartTime > flashDuration) {
    flashWalls = false;
  }
  
  // Draw maze cells.
  for (let cell of grid) {
    cell.show();
  }
  
  // Draw exit cell (bottom-right) with "EXIT".
  let exitCell = grid[index(cols - 1, rows - 1)];
  fill(0, 255, 0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("EXIT", exitCell.i * w + w/2, exitCell.j * w + w/2);
  
  // Draw the player's trail.
  noStroke();
  fill(255, 0, 0, 250);
  for (let pos of trail) {
    ellipse(pos.x, pos.y, ballDiameter * 0.8);
  }
  
  // Draw the player ball.
  fill(255, 0, 0);
  ellipse(player.x, player.y, ballDiameter);
  
  // Check for collision: if ball touches any wall, reset.
  if (checkCollision()) {
    dragging = false;
    resetMaze();
    return;
  }
  
  // Win condition: if ball reaches near the exit cell's center.
  let exitX = (cols - 0.5) * w;
  let exitY = (rows - 0.5) * w;
  if (dist(player.x, player.y, exitX, exitY) < 20) {
    gameWon = true;
  }
}

//
// Draw win screen: black background with glitching "YOU WIN!" text.
//
function drawWinScreen() {
  background(0);
  textFont(winFont);
  textSize(config.glitch.textSize);
  textAlign(CENTER, CENTER);
  
  let baseText = "WICKED IS GOOD";
  
  // Draw base text in white.
  fill(255);
  text(baseText, width / 2, height / 2);
  
  // Draw additional glitch layers.
  for (let i = 0; i < config.glitch.layers; i++) {
    let offsetX = random(-config.glitch.intensity, config.glitch.intensity);
    let offsetY = random(-config.glitch.intensity, config.glitch.intensity);
    fill(random(config.glitch.colorOffsets));
    text(baseText, width / 2 + offsetX, height / 2 + offsetY);
  }
}

//
// Mouse pressed: start dragging if near the ball, and clear trail.
//
function mousePressed() {
  if (dist(mouseX, mouseY, player.x, player.y) < ballDiameter) {
    dragging = true;
    trail = [];
  }
}

//
// Mouse dragged: update ball position and record trail.
//
function mouseDragged() {
  if (dragging) {
    player.x = mouseX;
    player.y = mouseY;
    trail.push({ x: player.x, y: player.y });
  }
}

//
// Mouse released: cancel dragging and reset the maze immediately.
//
function mouseReleased() {
  dragging = false;
  resetMaze();
}

//
// Collision detection: if the ball is too close to any wall, return true.
//
function checkCollision() {
  for (let cell of grid) {
    let x = cell.i * w;
    let y = cell.j * w;
    // Top wall.
    if (cell.walls[0]) {
      if (distToSegment(player.x, player.y, x, y, x + w, y) < config.collisionThreshold) return true;
    }
    // Right wall.
    if (cell.walls[1]) {
      if (distToSegment(player.x, player.y, x + w, y, x + w, y + w) < config.collisionThreshold) return true;
    }
    // Bottom wall.
    if (cell.walls[2]) {
      if (distToSegment(player.x, player.y, x, y + w, x + w, y + w) < config.collisionThreshold) return true;
    }
    // Left wall.
    if (cell.walls[3]) {
      if (distToSegment(player.x, player.y, x, y, x, y + w) < config.collisionThreshold) return true;
    }
  }
  return false;
}

//
// Reset maze: regenerate the maze, flash walls red briefly,
// reset player to start, clear the trail, and update the scoreboard.
//
function resetMaze() {
  flashWalls = true;
  flashStartTime = millis();
  
  // Update reset count and persist it.
  resetCount++;
  localStorage.setItem("mazeResetCount", resetCount);
  
  // Update scoreboard text.
  scoreboard.html("Attempts: " + resetCount);
  
  // Update the scoreboard color.
  // Every 5 resets, reduce green and blue to make the text slightly more red.
  let factor = Math.floor(resetCount / 5);
  let decrement = factor * 20; // Adjust the multiplier as desired.
  let greenBlue = Math.max(255 - decrement, 0);
  let newColor = "rgb(255," + greenBlue + "," + greenBlue + ")";
  scoreboard.style("color", newColor);
  
  // Regenerate the grid and maze.
  grid = [];
  stack = [];
  
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      grid.push(new Cell(i, j));
    }
  }
  
  current = grid[0];
  current.visited = true;
  while (true) {
    let next = current.checkNeighbors();
    if (next) {
      next.visited = true;
      stack.push(current);
      removeWalls(current, next);
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else {
      break;
    }
  }
  
  // Reset player position.
  player.x = w / 2;
  player.y = w / 2;
  trail = [];
}

//
// Helper: Distance from a point to a line segment.
//
function distToSegment(px, py, x1, y1, x2, y2) {
  let l2 = sq(x2 - x1) + sq(y2 - y1);
  if (l2 === 0) return dist(px, py, x1, y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = constrain(t, 0, 1);
  let projX = x1 + t * (x2 - x1);
  let projY = y1 + t * (y2 - y1);
  return dist(px, py, projX, projY);
}
