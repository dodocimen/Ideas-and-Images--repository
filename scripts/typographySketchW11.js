// === Constants and Global Variables ===
const MAX_IMAGE_DIMENSION = 50;
const MIN_IMAGE_DIMENSION = 20;
const PARTICLE_COUNT = 500;
const DEFAULT_TEXT_SIZE = 50;
const WORD_LENGTH_SHORT = 3;
const WORD_LENGTH_LONG = 12;
const AVOIDANCE_RADIUS = 60;       // <<< How close floating particles get before avoiding (pixels)
const AVOIDANCE_FORCE_MAG = .2;  // <<< Strength of the push-away force

let canvas;
let wordInput, submitButton, objectSetSelector, saveButton;
let font;
let particles = [];
let currentPoints = []; // Target points for the current word - NOW USED FOR AVOIDANCE
let objectImages = {};
let currentSet = 'mixed';
let currentDisplayDimension = MAX_IMAGE_DIMENSION;

// === PRELOAD ASSETS === (Unchanged)
function preload() {
  try {
    font = loadFont('./fonts/Roboto-Regular.ttf'); // <<<--- ENSURE PATH IS CORRECT
    console.log("Font loading attempted.");
  } catch (error) { console.error("Error loading font:", error); alert("ERROR loading font."); }

  const chainImagePaths = [ './img/diy/chain1.png', './img/diy/chain2.png' ];
  const buttonImagePaths = [ './img/diy/nail1.png', './img/diy/nail2.png','./img/diy/nail3.png', './img/diy/nail4.png', './img/diy/nail5.png', './img/diy/nail6.png', './img/diy/nail7.png' ];
  const tapeImagePaths = [ './img/diy/tape1.png', './img/diy/tape_strip1.png', './img/diy/tape2.png', './img/diy/tape3.png' ];

  let chainImgs = chainImagePaths.map(path => loadImage(path));
  let buttonImgs = buttonImagePaths.map(path => loadImage(path));
  let tapeImgs = tapeImagePaths.map(path => loadImage(path));

  objectImages.chains = chainImgs; objectImages.buttons = buttonImgs; objectImages.tapes = tapeImgs;
  objectImages.mixed = [...chainImgs, ...buttonImgs, ...tapeImgs];

  if (!objectImages.mixed || objectImages.mixed.length === 0) { alert("ERROR: No images loaded!"); console.error("ERROR: No images loaded!");
  } else { console.log("Image sets loaded:", Object.keys(objectImages).map(key => `${key}: ${objectImages[key].length} images`).join(', ')); }
}

// === SETUP SKETCH === (Unchanged)
function setup() {
  let canvasContainer = select('#typography-canvas');
  if (!canvasContainer) { console.error("ERROR: Canvas container '#typography-canvas' not found!"); return; }
  canvas = createCanvas(canvasContainer.width, canvasContainer.height);
  canvas.parent('typography-canvas');

  wordInput = select('#wordInput'); submitButton = select('#submitWord');
  objectSetSelector = select('#objectSetSelector'); saveButton = select('#saveImageBtn');
  if (!wordInput || !submitButton || !objectSetSelector || !saveButton) { console.error("ERROR: One or more control elements not found!"); return; }

  submitButton.mousePressed(handleWordSubmit);
  wordInput.elt.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleWordSubmit(); } });
  currentSet = objectSetSelector.value();
  objectSetSelector.changed(changeObjectSet);
  saveButton.mousePressed(saveCanvasImage);

  initializeParticles(PARTICLE_COUNT);

  textAlign(CENTER, CENTER);
  if (font) { textFont(font); console.log("Default font set."); }
  else { console.warn("Font not available during setup."); }
  textSize(DEFAULT_TEXT_SIZE);

  frameRate(60);
  console.log("DIY Drift Typography Initialized with set:", currentSet);
}

// === DRAW LOOP === (Unchanged)
function draw() {
  if (!canvas) return;
  clear();
  for (let i = 0; i < particles.length; i++) {
    particles[i].behaviors(); particles[i].update();
    particles[i].display(); particles[i].checkEdges();
  }
}

// === PARTICLE CLASS === (MODIFIED: Added avoid() method and behaviors() logic)
class ImageParticle {
    constructor(x, y, imgSet) { /* Constructor unchanged from previous version */
        this.pos = createVector(x, y); this.vel = p5.Vector.random2D().mult(random(0.5, 2)); this.acc = createVector(0, 0);
        this.target = null; this.imgSet = imgSet; this.img = null;
        this.baseRadius = (MAX_IMAGE_DIMENSION + MIN_IMAGE_DIMENSION) / 2 * 0.4;
        this.rotation = random(TWO_PI); this.rotationSpeed = random(-0.02, 0.02);
        this.state = 'floating'; this.damping = 0.98; this.arrivalThreshold = 5; this.wobbleMagnitude = 0;
        this.wobbleSpeed = random(0.05, 0.15); this.wobbleOffset = random(TWO_PI); this.scale = random(0.8, 1.1);
        this.maxSpeed = random(4, 8); this.maxForce = random(0.2, 0.5); this.floatMaxSpeed = random(0.5, 1.5);
        this.wobbleMagnitude = this.maxForce * 0.4;
        if (!imgSet || imgSet.length === 0) { console.warn("Particle created with invalid image set."); } else {
            this.img = random(this.imgSet);
        }
    }

    // *** MODIFIED behaviors() method ***
    behaviors() {
        if (this.target) {
            // Particle has a target - move towards it
            let arriveForce = this.arrive(this.target);
            this.applyForce(arriveForce);
            this.state = 'seeking';
        } else {
            // Particle is floating
            let floatForce = this.float(); // Get base floating force
            this.applyForce(floatForce);

            // *** ADD AVOIDANCE if a word is formed ***
            if (currentPoints.length > 0) {
                let avoidForce = this.avoid(currentPoints); // Calculate avoidance force
                avoidForce.mult(0.8); // Apply avoidance force with slightly less weight than float? (optional tuning)
                this.applyForce(avoidForce);
            }
            this.state = 'floating';
        }
    }

    applyForce(force) { this.acc.add(force); } // Unchanged

    update() { /* Unchanged */
        this.vel.add(this.acc);
        if (this.state === 'seeking') this.vel.limit(this.maxSpeed); else this.vel.limit(this.floatMaxSpeed);
        this.pos.add(this.vel); this.acc.mult(0); this.vel.mult(this.damping);
        let speed = this.vel.mag();
        if (this.state === 'seeking') this.rotationSpeed = lerp(this.rotationSpeed, map(speed, 0, this.maxSpeed, 0, random(0.05, 0.15)), 0.1);
        else this.rotationSpeed = lerp(this.rotationSpeed, random(-0.01, 0.01), 0.05);
        this.rotation += this.rotationSpeed;
    }

    display() { /* Unchanged */
        if (!this.img || !this.img.width || this.img.height <= 0) return;
        let targetDim = currentDisplayDimension; let scaledW, scaledH;
        let ow = this.img.width; let oh = this.img.height; let aspectRatio = ow / oh;
        if (ow >= oh) { scaledW = targetDim; scaledH = scaledW / aspectRatio; } else { scaledH = targetDim; scaledW = scaledH * aspectRatio; }
        push(); translate(this.pos.x, this.pos.y); rotate(this.rotation);
        let finalW = scaledW * this.scale; let finalH = scaledH * this.scale;
        imageMode(CENTER); image(this.img, 0, 0, finalW, finalH); pop();
    }

    arrive(target) { /* Unchanged */
        let desired = p5.Vector.sub(target, this.pos); let d = desired.mag(); let speed = this.maxSpeed;
        let arrivalRadius = 100; if (d < arrivalRadius) speed = map(d, 0, arrivalRadius, 0, this.maxSpeed);
        desired.setMag(speed); let steer = p5.Vector.sub(desired, this.vel); steer.limit(this.maxForce);
        if (d < arrivalRadius * 1.2 && d > this.arrivalThreshold) {
            let wobbleAngle = desired.heading() + HALF_PI;
            let wobbleScalar = sin(frameCount * this.wobbleSpeed + this.wobbleOffset) * this.wobbleMagnitude;
            let wobbleForce = p5.Vector.fromAngle(wobbleAngle); wobbleForce.setMag(wobbleScalar); steer.add(wobbleForce);
        }
        if (d < this.arrivalThreshold * 2) this.vel.mult(0.9); return steer;
    }

    // *** MODIFIED float() method to return the force ***
    float() {
        let angle = noise(this.pos.x * 0.005, this.pos.y * 0.005, frameCount * 0.005 + this.wobbleOffset) * TWO_PI * 4;
        let noiseForce = p5.Vector.fromAngle(angle);
        noiseForce.setMag(this.maxForce * 0.1); // Gentle force
        // Removed this.applyForce(noiseForce);
        return noiseForce; // Return the calculated force
    }

    // *** NEW avoid() method ***
    avoid(pointsToAvoid) {
        let totalAvoidanceForce = createVector(0, 0);
        let neighbors = 0;

        for (let i = 0; i < pointsToAvoid.length; i++) {
            // Use the raw point vector {x, y} from currentPoints
            let targetPoint = createVector(pointsToAvoid[i].x, pointsToAvoid[i].y);
            let d = p5.Vector.dist(this.pos, targetPoint);

            // Check if the point is within the avoidance radius
            if (d > 0 && d < AVOIDANCE_RADIUS) {
                let diff = p5.Vector.sub(this.pos, targetPoint); // Force pointing away from the target point
                diff.normalize();
                diff.div(d); // Weight by distance (stronger force when closer)
                totalAvoidanceForce.add(diff);
                neighbors++;
            }
        }

        // Average the force if neighbors were found
        if (neighbors > 0) {
            totalAvoidanceForce.div(neighbors);
            totalAvoidanceForce.setMag(AVOIDANCE_FORCE_MAG); // Apply defined magnitude
            // Optional: Steer the avoidance force
            // let steer = p5.Vector.sub(totalAvoidanceForce, this.vel);
            // steer.limit(this.maxForce * 0.5); // Limit the avoidance steering force
            // return steer;
            return totalAvoidanceForce; // Return the raw force for now
        } else {
            return createVector(0, 0); // No avoidance needed
        }
    }


    checkEdges() { /* Unchanged */
        let r = (MAX_IMAGE_DIMENSION + MIN_IMAGE_DIMENSION) / 2 * 0.4 * this.scale;
        if (this.pos.x > width + r) this.pos.x = -r; if (this.pos.x < -r) this.pos.x = width + r;
        if (this.pos.y > height + r) this.pos.y = -r; if (this.pos.y < -r) this.pos.y = height + r;
    }
    updateImage(newImgSet) { /* Unchanged */
        if (!newImgSet || newImgSet.length === 0) return; this.imgSet = newImgSet; this.img = random(this.imgSet);
    }
    releaseTarget() { /* Unchanged */
        if (this.target !== null) this.vel.add(p5.Vector.random2D().mult(random(1, 3))); this.target = null; this.state = 'floating';
    }
} // End of ImageParticle Class


// === HELPER FUNCTIONS ===

// Initialize Particles (Unchanged)
function initializeParticles(num) { /* ... unchanged ... */
    particles = []; let initialImgSet = objectImages[currentSet];
    if (!initialImgSet || initialImgSet.length === 0) {
        console.warn(`Image set '${currentSet}' empty. Falling back to 'mixed'.`); currentSet = 'mixed';
        if (objectSetSelector) objectSetSelector.selected('mixed'); initialImgSet = objectImages[currentSet];
        if (!initialImgSet || initialImgSet.length === 0) { console.error("CRITICAL: Fallback 'mixed' set empty."); return; }
    }
    for (let i = 0; i < num; i++) particles.push(new ImageParticle(random(width), random(height), initialImgSet));
    console.log(`Initialized ${particles.length} particles.`);
}

// handleWordSubmit Function (Unchanged)
function handleWordSubmit() { /* ... unchanged ... */
    if (!wordInput) return; let word = wordInput.value().trim(); let wordLength = word.length;
    console.log(`--- Handling Word Submit: "${word}" (Length: ${wordLength}) ---`);
    console.log("Releasing all particle targets..."); for (let particle of particles) particle.releaseTarget(); currentPoints = [];
    if (wordLength > 0) { currentDisplayDimension = map(wordLength, WORD_LENGTH_SHORT, WORD_LENGTH_LONG, MAX_IMAGE_DIMENSION, MIN_IMAGE_DIMENSION); currentDisplayDimension = constrain(currentDisplayDimension, MIN_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION); }
    else { currentDisplayDimension = MAX_IMAGE_DIMENSION; }
    console.log(`Calculated Display Dimension: ${currentDisplayDimension.toFixed(1)}px`);
    if (word === '') { console.log("Input empty, all particles set to float."); return; }
    if (!font) { console.error("Cannot generate points: Font not loaded!"); alert("Font not loaded."); return; }
    try {
        textFont(font); textAlign(CENTER, CENTER); textSize(DEFAULT_TEXT_SIZE);
        let desiredWidth = width * 0.8; let textW = textWidth(word); let dynamicSize = DEFAULT_TEXT_SIZE;
        if (textW > 0) dynamicSize = min(DEFAULT_TEXT_SIZE * (desiredWidth / textW), height * 0.7); else dynamicSize = min(DEFAULT_TEXT_SIZE, height * 0.7);
        textSize(dynamicSize); let wordWidth = textWidth(word); let x = (width - wordWidth) / 2; let y = height / 2;
        let options = { sampleFactor: 0.1, simplifyThreshold: 0 };
        currentPoints = font.textToPoints(word, x, y, dynamicSize, options); console.log(`Generated ${currentPoints.length} points for "${word}".`);
    } catch (error) { console.error("Error during text point calculation:", error); currentPoints = []; }
    if (currentPoints.length > 0) {
        let pointIndex = 0; let particlesNeeded = currentPoints.length; let availableParticles = particles.length;
        for (let i = 0; i < availableParticles; i++) {
            if (pointIndex < particlesNeeded) { let targetVec = createVector(currentPoints[pointIndex].x, currentPoints[pointIndex].y); particles[i].target = targetVec; particles[i].state = 'seeking'; pointIndex++; }
            else { if (particles[i].target !== null) particles[i].releaseTarget(); }
        }
        console.log(`Assigned ${pointIndex} targets to particles.`); if(pointIndex < particlesNeeded) console.warn(`More points (${particlesNeeded}) generated than particles (${availableParticles}).`);
    } else { console.warn("No points generated, all particles remain floating."); for (let particle of particles) { if (particle.target !== null) particle.releaseTarget(); } }
    console.log(`--- Word Handling Complete for: "${word}" ---`);
}

// Change Object Set (Unchanged)
function changeObjectSet() { /* ... unchanged ... */
    if (!objectSetSelector) return; currentSet = objectSetSelector.value();
    console.log("Changing object set to:", currentSet); let newImgSet = objectImages[currentSet];
    if (!newImgSet || newImgSet.length === 0) { console.error(`Set '${currentSet}' empty. Reverting.`); currentSet = 'mixed'; objectSetSelector.selected('mixed'); newImgSet = objectImages[currentSet]; if (!newImgSet || newImgSet.length === 0) { console.error("Fallback 'mixed' set empty."); return; } }
    for (let particle of particles) particle.updateImage(newImgSet);
}

// Save Canvas Image (Unchanged)
function saveCanvasImage() { /* ... unchanged ... */
    if (!wordInput) return; let filenameBase = 'diy_typography'; let wordPart = wordInput.value().trim().replace(/\s+/g, '_').toLowerCase();
    if (wordPart) filenameBase += '_' + wordPart; let filename = filenameBase + '_' + Date.now(); saveCanvas(filename, 'png');
}

// Window Resized (Unchanged)
function windowResized() { /* ... unchanged ... */
    let canvasContainer = select('#typography-canvas');
    if (canvasContainer) { resizeCanvas(canvasContainer.width, canvasContainer.height); console.log("Canvas resized to:", width, height); if (currentPoints.length > 0 && typeof handleWordSubmit === 'function') { console.log("Recalculating points after resize..."); handleWordSubmit(); } }
    else { console.warn("Canvas container not found on resize."); }
}