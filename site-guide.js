(() => {
  'use strict';
  const guide = document.querySelector('.site-guide');
  if (!guide) return;
  // Native FAQ toggles must not trigger the lobby's Enter-to-start shortcut.
  guide.addEventListener('keydown', event => {
    if (event.target.closest('summary') && (event.key === 'Enter' || event.code === 'Space')) event.stopPropagation();
  });
  const goToMenu = () => {
    if (document.querySelector('#lobby').hidden) document.querySelector('#back').click();
  };
  const showMenu = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('.wrap').scrollIntoView({behavior:reduced ? 'auto' : 'smooth',block:'start'});
    const start = document.querySelector('#start');
    (start.disabled ? document.querySelector('#openDaily') : start).focus({preventScroll:true});
  };
  guide.addEventListener('click', event => {
    const button = event.target.closest('button[data-guide-top],button[data-guide-genre],button[data-guide-era]');
    if (!button || !guide.contains(button)) return;
    if (button.hasAttribute('data-guide-top')) {
      goToMenu(); showMenu(); return;
    }
    const genreChoice = button.getAttribute('data-guide-genre');
    const eraChoice = button.getAttribute('data-guide-era');
    const target = document.querySelector(genreChoice !== null ? '#genre' : '#era');
    const value = genreChoice !== null ? genreChoice : eraChoice;
    if (!Array.from(target.options).some(option => option.value === value)) return;
    goToMenu();
    // Each shortcut starts broad; players can combine filters in the menu.
    const other = document.querySelector(genreChoice !== null ? '#era' : '#genre');
    if (other.value !== 'all') {
      other.value = 'all';
      other.dispatchEvent(new Event('change', {bubbles:true}));
    }
    target.value = value;
    target.dispatchEvent(new Event('change', {bubbles:true}));
    const label = target.options[target.selectedIndex].textContent;
    document.querySelector('#guideAnnouncement').textContent = label + ' selected in Classic.';
    showMenu();
  });
})();
