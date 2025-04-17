document.addEventListener('DOMContentLoaded', () => {
  const defaultTheme = { bg: '#0300BF', text: '#D9D9D9' };
  const darkTheme = { bg: '#D9D9D9', text: '#0300BF' };
  const themeKey = 'interactiveTypographyTheme';

  function applyTheme(theme) {
      const root = document.documentElement;
      root.style.setProperty('--background-color', theme.bg);
      root.style.setProperty('--text-color', theme.text);
  }

  function toggleTheme() {
      const currentThemeName = localStorage.getItem(themeKey);
      if (currentThemeName === 'dark') {
          applyTheme(defaultTheme);
          localStorage.setItem(themeKey, 'default');
      } else {
          applyTheme(darkTheme);
          localStorage.setItem(themeKey, 'dark');
      }
  }

  const savedThemeName = localStorage.getItem(themeKey);
  if (savedThemeName === 'dark') {
      applyTheme(darkTheme);
  } else {
      applyTheme(defaultTheme);
  }

  const logoImg = document.querySelector('.logo-img');
  const footerLogo = document.querySelector('.projects-footer .right-img');

  if (logoImg) {
      logoImg.style.cursor = 'pointer';
      logoImg.addEventListener('click', toggleTheme);
  } else if (footerLogo) {
      footerLogo.style.cursor = 'pointer';
      footerLogo.addEventListener('click', toggleTheme);
  }

});