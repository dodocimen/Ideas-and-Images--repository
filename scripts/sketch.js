




let customModel;
let textureImg; 
let rotationX = 24.2;
let rotationY = 6.7;
let lastMouseX, lastMouseY;
let lastInteractionTime = 0;
const autoRotationDelay = 500; 


function preload() {
  customModel = loadModel('./models/tape.obj', true);
  textureImg = loadImage('./models/textures/texture1.png'); 
}

function setup() {
  
  let canvas = createCanvas(600, 600, WEBGL);
  
  canvas.parent('hero');
  lastInteractionTime = millis();
  noStroke(); 
}

function draw() {
  
  background(0,0);

  
  if (millis() - lastInteractionTime > autoRotationDelay) {
    rotationY += 0.01; 
  }

  
  rotateX(rotationX);
  rotateY(rotationY);

  
  texture(textureImg);

  
  scale(2);

  
  if (windowWidth <= 500) {
    scale(.8); 
  }

  
  model(customModel);
}


function mousePressed() {
  lastInteractionTime = millis();
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}


function mouseDragged() {
  lastInteractionTime = millis();

  
  let deltaX = mouseX - lastMouseX;
  let deltaY = mouseY - lastMouseY;

  
  rotationY += deltaX * 0.01;
  rotationX += deltaY * 0.01;

  
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}



document.addEventListener('DOMContentLoaded', () => {
  
  const links = document.querySelectorAll('.navigation ul li a');
  let activeIndex = 0; 

  
  const arrowSound = new Audio('./sfx/arrow.mp3');
  
  const backgroundSound = new Audio('./sfx/bgmusic.mp3');

  
  backgroundSound.loop = true;
  
  
  backgroundSound.volume = 0.5; 
  backgroundSound.play().catch(err => console.log('BG sound blocked:', err));

  
  if (links.length > 0) {
    links[activeIndex].classList.add('active');
  }

  
  function updateActiveLink(newIndex) {
    
    links.forEach(link => link.classList.remove('active'));
    
    links[newIndex].classList.add('active');
  }

  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      
      
    });
  });

  
  document.addEventListener('keydown', (e) => {
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      arrowSound.currentTime = 0;
      arrowSound.play().catch(err => console.log('Arrow sound play failed:', err));
    }

    if (e.key === 'ArrowDown') {
      
      activeIndex = (activeIndex + 1) % links.length;
      updateActiveLink(activeIndex);
      e.preventDefault(); 
    }
    else if (e.key === 'ArrowUp') {
      
      activeIndex = (activeIndex - 1 + links.length) % links.length;
      updateActiveLink(activeIndex);
      e.preventDefault();
    }
    
    else if (e.key === 'Enter') {
      e.preventDefault(); 
      let targetLink = links[activeIndex];
      window.location.href = targetLink.href; 
    }
  });
});



document.addEventListener("DOMContentLoaded", () => {
  const bgTextEl = document.querySelector('.background-text');
  
  if (bgTextEl) {
      
      const originalText = bgTextEl.innerText;

      
      const wrappedText = originalText.split('').map(char => {
        return char === "\n" ? "<br>" : `<span data-original="${char}">${char}</span>`;
      }).join('');

      
      bgTextEl.innerHTML = wrappedText;

      
      const spans = bgTextEl.querySelectorAll('span');

      
      function getRandomChar() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }

      
      setInterval(() => {
        if (spans.length === 0) return;
        const randomIndex = Math.floor(Math.random() * spans.length);
        const span = spans[randomIndex];
        const originalChar = span.getAttribute('data-original');

        
        span.textContent = getRandomChar();

        
        setTimeout(() => {
          span.textContent = originalChar;
        }, 1000);
      }, 200);
    }
});




document.addEventListener('DOMContentLoaded', () => {
  
  const flipContainers = document.querySelectorAll('.image-flip-container');

  flipContainers.forEach(container => {
    container.addEventListener('click', () => {
      
      
      
      
      
      
      container.classList.toggle('is-flipped');
    });
  });
});



