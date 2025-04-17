// projectsNavigation.js
// Keyboard navigation for .projects-navbar and .project_selection links,
// with two distinct sounds: arrow, and background loop.
// (Removed click sound)
// MODIFIED: Added check for projectW3.html to avoid interfering with its keyTyped

document.addEventListener('DOMContentLoaded', () => {
  // Select all project + navbar links
  const projectLinks = document.querySelectorAll('.project_selection ul li a');
  const navbarLinks = document.querySelectorAll('.projects-navbar ul li a');

  // 1) arrowSound – Plays on arrow key press
  const arrowSound = new Audio('./sfx/arrow.mp3');

  // 3) bgMusic – Looping background (only if on theProject.html)
  let bgMusic;
  // Determine if we are on projectW3.html
  const isOnProjectW3 = window.location.pathname.endsWith('projectW3.html');

  if (window.location.href.includes('theProject.html')) {
    bgMusic = new Audio('./sfx/bgmusic.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.7; // adjust as desired
    // Try playing at DOMContentLoaded (some browsers block until user gesture)
    bgMusic.play().catch(err => console.log('BG music blocked until user gesture:', err));
  }

  // Default active indices
  let activeProjectIndex = 0;
  let activeNavbarIndex = -1; // Start with no navbar link active by default on this page

  // Find the index of the currently active navbar link (if any) based on the page URL
  // Or default to index 2 ('the_project') if on theProject.html
  if (window.location.href.includes('theProject.html')) {
      activeNavbarIndex = 2; // 'the_project' is usually index 2
  } else {
      // Find which link points to the current page
      navbarLinks.forEach((link, index) => {
          if (window.location.href.endsWith(link.getAttribute('href'))) {
              activeNavbarIndex = index;
          }
      });
       // If still not found (e.g., on a week page but no link matched), default to index 2
       if (activeNavbarIndex === -1 && navbarLinks.length > 2) {
           activeNavbarIndex = 2;
       }
  }


  // Current nav mode ('projects' or 'navbar')
  let currentMode = "projects"; // Default to project list if it exists
  if (projectLinks.length === 0) {
      currentMode = "navbar"; // If no project links (e.g., on a week page), default to navbar
  }


  // Initialize 'active' classes
  if (projectLinks.length > 0) {
    updateProjectActiveLink(activeProjectIndex);
  }
  if (navbarLinks.length > 0 && activeNavbarIndex !== -1) {
     updateNavbarActiveLink(activeNavbarIndex);
  } else if (navbarLinks.length > 2) {
      // Fallback: ensure 'the_project' is active if index detection failed
      updateNavbarActiveLink(2);
  }


  // --------- Helper Functions ----------

  function updateProjectActiveLink(newIndex) {
    projectLinks.forEach(link => link.classList.remove('active'));
    if (projectLinks[newIndex]) {
        projectLinks[newIndex].classList.add('active');
    }
  }

  function updateNavbarActiveLink(newIndex) {
    navbarLinks.forEach(link => link.classList.remove('active'));
     if (navbarLinks[newIndex]) {
        navbarLinks[newIndex].classList.add('active');
    }
  }

  // 1) Play arrowSound on arrow keys
  function playArrowSound() {
    arrowSound.currentTime = 0;
    arrowSound.play().catch(err => console.log('arrowSound error:', err));
  }

  // (Removed handleLinkActivation function)

  // 3) KEYDOWN EVENT LISTENER
  document.addEventListener('keydown', (e) => {

    // --- FIX FOR W3 KEYBOARD INPUT ---
    // Check if we are on projectW3.html and the key is NOT Enter or an Arrow key
    if (isOnProjectW3 && e.key !== 'Enter' && !e.key.startsWith('Arrow')) {
        // If it's a regular key press on W3, let p5 handle it directly.
        // Do nothing here to allow the event to propagate to p5's keyTyped.
        console.log('W3: Letting key press through for p5:', e.key);
        return;
    }
    // --- END FIX ---


    // If arrow key => arrowSound (This will still play for arrows on W3, but won't interfere with typing)
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
      playArrowSound();
    }

    // Up/Down => project links (only if projectLinks exist)
    if (e.key === 'ArrowDown' && projectLinks.length > 0) {
      currentMode = "projects";
      activeProjectIndex = (activeProjectIndex + 1) % projectLinks.length;
      updateProjectActiveLink(activeProjectIndex);
      e.preventDefault();
    }
    else if (e.key === 'ArrowUp' && projectLinks.length > 0) {
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
    // Enter => Navigate immediately
    else if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default actions

      if (currentMode === "navbar" && activeNavbarIndex !== -1 && navbarLinks[activeNavbarIndex]) {
        window.location.href = navbarLinks[activeNavbarIndex].href;
      }
      else if (currentMode === "projects" && projectLinks.length > 0 && projectLinks[activeProjectIndex]) {
        window.location.href = projectLinks[activeProjectIndex].href;
      }
    }
  });

  // 4) MOUSE CLICKS on each link => Navigate immediately
  navbarLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      // Default link behavior handles navigation
    });
  });

  projectLinks.forEach(link => {
    link.addEventListener('click', (event) => {
       // Default link behavior handles navigation
    });
  });
});