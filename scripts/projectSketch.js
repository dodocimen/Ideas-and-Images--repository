// projectsNavigation.js
// Keyboard navigation for .projects-navbar and .project_selection links,
// with three distinct sounds: arrow, click, and background loop.

document.addEventListener('DOMContentLoaded', () => {
  // Select all project + navbar links
  const projectLinks = document.querySelectorAll('.project_selection ul li a');
  const navbarLinks = document.querySelectorAll('.projects-navbar ul li a');

  // 1) arrowSound – Plays on arrow key press
  const arrowSound = new Audio('./sfx/arrow.mp3'); 

  // 2) clickSound – Fully plays before loading new link
  const clickSound = new Audio('./sfx/click.mp3');

  // 3) bgMusic – Looping background (only if on theProject.html)
  let bgMusic;
  if (window.location.href.includes('theProject.html')) {
    bgMusic = new Audio('./sfx/bgmusic.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.7; // adjust as desired
    // Try playing at DOMContentLoaded (some browsers block until user gesture)
    bgMusic.play().catch(err => console.log('BG music blocked until user gesture:', err));
  }

  // Default active indices
  let activeProjectIndex = 0;
  let activeNavbarIndex = 3; // "the_project" is assumed to be at index 3

  // Current nav mode
  let currentMode = "navbar";

  // Initialize 'active' classes
  if (projectLinks.length > 0) {
    projectLinks[activeProjectIndex].classList.add('active');
  }
  if (navbarLinks.length > activeNavbarIndex) {
    navbarLinks.forEach(link => link.classList.remove('active'));
    navbarLinks[activeNavbarIndex].classList.add('active');
  }

  // --------- Helper Functions ----------

  function updateProjectActiveLink(newIndex) {
    projectLinks.forEach(link => link.classList.remove('active'));
    projectLinks[newIndex].classList.add('active');
  }

  function updateNavbarActiveLink(newIndex) {
    navbarLinks.forEach(link => link.classList.remove('active'));
    navbarLinks[newIndex].classList.add('active');
  }

  // 1) Play arrowSound on arrow keys
  function playArrowSound() {
    arrowSound.currentTime = 0;
    arrowSound.play().catch(err => console.log('arrowSound error:', err));
  }

  // 2) Fully play the clickSound, then go to link
  function handleLinkActivation(link) {
    // Stop default link behavior
    event.preventDefault();

    // Reset + play sound
    clickSound.currentTime = 0;
    
    // Remove any previously attached ended listeners,
    // in case the user spams multiple link clicks.
    clickSound.removeEventListener('ended', onClickSoundEnded);

    // Define the ended callback
    function onClickSoundEnded() {
      // remove ended listener so it doesn't trigger multiple times
      clickSound.removeEventListener('ended', onClickSoundEnded);
      // now load the link
      window.location.href = link.href;
    }

    // Attach ended event, then attempt to play
    clickSound.addEventListener('ended', onClickSoundEnded);
    clickSound.play().catch(err => {
      console.log('clickSound error:', err);
      // if sound fails, just go to link
      window.location.href = link.href;
    });
  }

  // 3) KEYDOWN EVENT LISTENER
  document.addEventListener('keydown', (e) => {
    // If arrow key => arrowSound
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
      playArrowSound();
    }

    // Up/Down => project links
    if (e.key === 'ArrowDown') {
      currentMode = "projects";
      activeProjectIndex = (activeProjectIndex + 1) % projectLinks.length;
      updateProjectActiveLink(activeProjectIndex);
      e.preventDefault();
    } 
    else if (e.key === 'ArrowUp') {
      currentMode = "projects";
      activeProjectIndex = (activeProjectIndex - 1 + projectLinks.length) % projectLinks.length;
      updateProjectActiveLink(activeProjectIndex);
      e.preventDefault();
    }
    // Left/Right => navbar links
    else if (e.key === 'ArrowRight') {
      currentMode = "navbar";
      activeNavbarIndex = (activeNavbarIndex + 1) % navbarLinks.length;
      updateNavbarActiveLink(activeNavbarIndex);
      e.preventDefault();
    } 
    else if (e.key === 'ArrowLeft') {
      currentMode = "navbar";
      activeNavbarIndex = (activeNavbarIndex - 1 + navbarLinks.length) % navbarLinks.length;
      updateNavbarActiveLink(activeNavbarIndex);
      e.preventDefault();
    }
    // Enter => fully play clickSound, then load link
    else if (e.key === 'Enter') {
      e.preventDefault();

      if (currentMode === "navbar") {
        handleLinkActivation(navbarLinks[activeNavbarIndex]);
      } 
      else if (currentMode === "projects") {
        handleLinkActivation(projectLinks[activeProjectIndex]);
      }
    }
  });

  // 4) MOUSE CLICKS on each link => handleLinkActivation
  navbarLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      handleLinkActivation(link);
    });
  });

  projectLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      handleLinkActivation(link);
    });
  });
});
