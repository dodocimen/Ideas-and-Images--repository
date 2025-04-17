

document.addEventListener('DOMContentLoaded', () => {
  
  const projectLinks = document.querySelectorAll('.project_selection ul li a');
  const navbarLinks = document.querySelectorAll('.projects-navbar ul li a');

  
  const arrowSound = new Audio('./sfx/arrow.mp3');

  
  let bgMusic;
  
  const isOnProjectW3 = window.location.pathname.endsWith('projectW3.html');

  if (window.location.href.includes('theProject.html')) {
    bgMusic = new Audio('./sfx/bgmusic.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.7; 
    
    bgMusic.play().catch(err => console.log('BG music blocked until user gesture:', err));
  }

  
  let activeProjectIndex = 0;
  let activeNavbarIndex = -1; 

  
  
  if (window.location.href.includes('theProject.html')) {
      activeNavbarIndex = 2; 
  } else {
      
      navbarLinks.forEach((link, index) => {
          if (window.location.href.endsWith(link.getAttribute('href'))) {
              activeNavbarIndex = index;
          }
      });
       
       if (activeNavbarIndex === -1 && navbarLinks.length > 2) {
           activeNavbarIndex = 2;
       }
  }


  
  let currentMode = "projects"; 
  if (projectLinks.length === 0) {
      currentMode = "navbar"; 
  }


  
  if (projectLinks.length > 0) {
    updateProjectActiveLink(activeProjectIndex);
  }
  if (navbarLinks.length > 0 && activeNavbarIndex !== -1) {
     updateNavbarActiveLink(activeNavbarIndex);
  } else if (navbarLinks.length > 2) {
      
      updateNavbarActiveLink(2);
  }


  

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

  
  function playArrowSound() {
    arrowSound.currentTime = 0;
    arrowSound.play().catch(err => console.log('arrowSound error:', err));
  }

  

  
  document.addEventListener('keydown', (e) => {

    
    
    if (isOnProjectW3 && e.key !== 'Enter' && !e.key.startsWith('Arrow')) {
        
        
        console.log('W3: Letting key press through for p5:', e.key);
        return;
    }
    


    
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
      playArrowSound();
    }

    
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
    
    else if (e.key === 'Enter') {
      e.preventDefault(); 

      if (currentMode === "navbar" && activeNavbarIndex !== -1 && navbarLinks[activeNavbarIndex]) {
        window.location.href = navbarLinks[activeNavbarIndex].href;
      }
      else if (currentMode === "projects" && projectLinks.length > 0 && projectLinks[activeProjectIndex]) {
        window.location.href = projectLinks[activeProjectIndex].href;
      }
    }
  });

  
  navbarLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      
    });
  });

  projectLinks.forEach(link => {
    link.addEventListener('click', (event) => {
       
    });
  });
});