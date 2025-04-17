/**
 * Typographic Oracle Card in p5.js
 * 
 * This snippet focuses on using only text elements for the card design,
 * animating them in a swirling pattern around the center of the "card."
 */

// State variables
let currentState = "start"; // can be "start" or "reveal"
let swirlWords = [];        // an array to hold all word objects

// We'll store some text phrases for each hat
// (Of course, adapt or expand as needed)
let hatMeanings = [
  "White Hat: Clarity, Neutrality, Facts",
  "Red Hat: Emotions, Intuition, Sensitivity",
  "Black Hat: Skepticism, Risks, Critique",
  "Yellow Hat: Positivity, Benefits, Sunshine",
  "Green Hat: Creativity, Growth, Possibility",
  "Blue Hat: Organization, Control, Management"
];

// For demonstration, let's assume user picked hat #2
let revealedHatIndex = 2;

function setup() {
  createCanvas(800, 600);

  // (Imagine you have hats on screen. On click, you'd set currentState to 'reveal' and choose an index.)
  // We'll skip that to focus purely on the typographic reveal.

  // Potentially: swirlWords array is created AFTER the user picks a hat
  // We'll simulate that here:
  createSwirlWords(hatMeanings[revealedHatIndex]);
}

function draw() {
  background(20);

  if (currentState === "start") {
    // Placeholder for the start screen
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Click on a Hat (Simulation)", width / 2, height / 2);
  } 
  else if (currentState === "reveal") {
    drawTypographicCard();
  }
}

/**
 * Create the swirling words:
 * We break the hat meaning into separate words or phrases,
 * then assign each a random angle, radius, speed, and text size.
 */
function createSwirlWords(meaningString) {
  swirlWords = [];
  
  // Split into words (you might want to split on spaces or punctuation)
  let wordsArray = meaningString.split(" ");
  
  for (let i = 0; i < wordsArray.length; i++) {
    let w = wordsArray[i];

    swirlWords.push({
      text: w,
      // Start angle: random range around the circle
      angle: random(TWO_PI),
      // Radius (distance from center)
      radius: random(50, 150),
      // How fast does this word orbit?
      speed: random(0.005, 0.02),
      // Each word can have a random text size
      size: random(14, 30),
      // A random color (optional for variation)
      color: color(random(100,255), random(100,255), random(100,255))
    });
  }
}

/**
 * This function draws the swirling text around the center,
 * plus any background or bounding "card" shape if we wish.
 */
function drawTypographicCard() {
  // Optionally, draw a rectangle to represent the 'card' boundary
  // for a purely typographic approach, we might keep it subtle
  push();
  noStroke();
  fill(100, 50); // a bit translucent
  rectMode(CENTER);
  rect(width/2, height/2, 400, 400, 20);
  pop();
  
  // Draw each swirling word
  for (let i = 0; i < swirlWords.length; i++) {
    let sw = swirlWords[i];
    
    // Update the angle for orbiting effect
    sw.angle += sw.speed;
    
    // Calculate x, y based on angle + radius from center
    let xPos = width/2 + sw.radius * cos(sw.angle);
    let yPos = height/2 + sw.radius * sin(sw.angle);
    
    // Draw the text
    fill(sw.color);
    textSize(sw.size);
    textAlign(CENTER, CENTER);
    text(sw.text, xPos, yPos);
  }
}

/**
 * On mouse press, we can simulate going from 'start' to 'reveal'
 * or going back. This is a minimal approach just to illustrate.
 */
function mousePressed() {
  if (currentState === "start") {
    currentState = "reveal";
  } else if (currentState === "reveal") {
    currentState = "start";
  }
}
