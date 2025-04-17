/*
 * script.js
 * This file contains both the p5.js sketch for the custom 3D model with texture,
 * the keyboard navigation for the menu, and now two sounds:
 * 1) arrowSound for arrow key navigation
 * 3) backgroundSound for infinite looping background audio
 * (Removed linkSound/click sound)
 */

/******************
 * p5.js Sketch Section
 ******************/

// Global variables for the model, texture, and rotation state.
let customModel;
let textureImg; // holds the texture image
let rotationX = 24.2;
let rotationY = 6.7;
let lastMouseX, lastMouseY;
let lastInteractionTime = 0;
const autoRotationDelay = 500; // delay (ms) before auto-rotation resumes

// Preload the custom model and texture image.
function preload() {
  customModel = loadModel('./models/tape.obj', true);
  textureImg = loadImage('./models/textures/texture1.png'); // path to your texture image
}

function setup() {
  // Create a canvas with WEBGL for 3D rendering.
  let canvas = createCanvas(600, 600, WEBGL);
  // Attach the canvas to the hero section using its ID.
  canvas.parent('hero');
  lastInteractionTime = millis();
  noStroke(); // Removes wireframe lines for a cleaner look.
}

function draw() {
  // Set a black background.
  background(0,0);

  // Resume auto-rotation if no user interaction within the delay.
  if (millis() - lastInteractionTime > autoRotationDelay) {
    rotationY += 0.01; // Auto-rotate around the Y axis.
  }

  // Apply current rotations.
  rotateX(rotationX);
  rotateY(rotationY);

  // Map the texture to the model.
  texture(textureImg);

  // Optionally scale the model (adjust as needed).
  scale(2);

  // Adjust model size based on screen width
  if (windowWidth <= 500) {
    scale(.8); // Smaller model for mobile screens
  }

  // Render the textured custom 3D model.
  model(customModel);
}

// Record the mouse position when pressed.
function mousePressed() {
  lastInteractionTime = millis();
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

// Update rotation based on mouse drag.
function mouseDragged() {
  lastInteractionTime = millis();

  // Calculate the change in mouse position.
  let deltaX = mouseX - lastMouseX;
  let deltaY = mouseY - lastMouseY;

  // Update rotation angles (adjust multiplier for sensitivity).
  rotationY += deltaX * 0.01;
  rotationX += deltaY * 0.01;

  // Update stored mouse positions for the next frame.
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

/******************
 * Keyboard Navigation Section
 ******************/

document.addEventListener('DOMContentLoaded', () => {
  // Select all navigation links.
  const links = document.querySelectorAll('.navigation ul li a');
  let activeIndex = 0; // Default active link index.

  // 1) Sound effect for arrow navigation
  const arrowSound = new Audio('./sfx/arrow.mp3');
  // 3) Infinite background sound
  const backgroundSound = new Audio('./sfx/bgmusic.mp3');

  // Initialize background sound
  backgroundSound.loop = true;
  // Attempt to play it as soon as DOM is loaded
  // (User must interact (key or click) before some browsers allow it)
  backgroundSound.volume = 0.5; // adjust as desired
  backgroundSound.play().catch(err => console.log('BG sound blocked:', err));

  // Ensure the first link is active by default.
  if (links.length > 0) {
    links[activeIndex].classList.add('active');
  }

  // A function to update the active link visually
  function updateActiveLink(newIndex) {
    // Remove the active class from all links
    links.forEach(link => link.classList.remove('active'));
    // Add it to the new selection
    links[newIndex].classList.add('active');
  }

  // *** MOUSE CLICK on any link => Navigate immediately ***
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      // Default link behavior will handle navigation
      // No sound playback needed
    });
  });

  // Keydown events for arrow navigation & Enter
  document.addEventListener('keydown', (e) => {
    // If user presses arrow keys => arrowSound
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      arrowSound.currentTime = 0;
      arrowSound.play().catch(err => console.log('Arrow sound play failed:', err));
    }

    if (e.key === 'ArrowDown') {
      // Cycle to the next link
      activeIndex = (activeIndex + 1) % links.length;
      updateActiveLink(activeIndex);
      e.preventDefault(); // Prevent default scrolling
    }
    else if (e.key === 'ArrowUp') {
      // Cycle to the previous link
      activeIndex = (activeIndex - 1 + links.length) % links.length;
      updateActiveLink(activeIndex);
      e.preventDefault();
    }
    // Pressing Enter => Navigate immediately
    else if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission/button activation
      let targetLink = links[activeIndex];
      window.location.href = targetLink.href; // Navigate directly
    }
  });
});

// This script wraps each character of the background text in a span and
// randomly replaces some letters with random characters to create a hacker effect.
document.addEventListener("DOMContentLoaded", () => {
  const bgTextEl = document.querySelector('.background-text');
  // Only run if the background text element exists (it's on the homepage)
  if (bgTextEl) {
      // Get the text content including newlines (where <br> tags become newlines)
      const originalText = bgTextEl.innerText;

      // Wrap each character in a span, preserving newlines as <br>
      const wrappedText = originalText.split('').map(char => {
        return char === "\n" ? "<br>" : `<span data-original="${char}">${char}</span>`;
      }).join('');

      // Set the new HTML content
      bgTextEl.innerHTML = wrappedText;

      // Select all the span elements
      const spans = bgTextEl.querySelectorAll('span');

      // Function to generate a random character from a defined set
      function getRandomChar() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Periodically pick a random letter to "glitch"
      setInterval(() => {
        if (spans.length === 0) return;
        const randomIndex = Math.floor(Math.random() * spans.length);
        const span = spans[randomIndex];
        const originalChar = span.getAttribute('data-original');

        // Change the text to a random character
        span.textContent = getRandomChar();

        // Revert back after 1 second
        setTimeout(() => {
          span.textContent = originalChar;
        }, 1000);
      }, 200);
    }
});


// --- Image Flip Functionality ---
// Added to handle clicking on image containers with the class 'image-flip-container'
document.addEventListener('DOMContentLoaded', () => {
  // Find all image flip containers on the page
  const flipContainers = document.querySelectorAll('.image-flip-container');

  flipContainers.forEach(container => {
    container.addEventListener('click', () => {
      // Find the inner flipper element to apply the class to
      // const flipper = container.querySelector('.image-flipper'); // Select the flipper inside
      // if (flipper) {
      //   flipper.classList.toggle('is-flipped'); // Toggle on the flipper
      // }
      // Correction based on CSS: Toggle class on the container itself
      container.classList.toggle('is-flipped');
    });
  });
});
// --- End Image Flip Functionality ---


