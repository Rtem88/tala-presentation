(() => {
  const root = document.documentElement;
  const themeControl = document.querySelector('.theme-switch');
  function updateTheme(value) {
    root.dataset.theme = value;
    themeControl.setAttribute('aria-checked', String(value === 'dark'));
    document.querySelector('meta[name="theme-color"]').content = value === 'dark' ? '#081722' : '#edf7fc';
  }
  updateTheme(root.dataset.theme);
  themeControl.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.classList.add('changing-theme');
    updateTheme(next);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('changing-theme')));
    try { localStorage.setItem('tala-theme', next); } catch {}
  });

  for (const card of document.querySelectorAll('.glass-card')) {
    function sparkle(event) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--px', event.clientX - rect.left + 'px');
      card.style.setProperty('--py', event.clientY - rect.top + 'px');
    }
    card.addEventListener('pointermove', sparkle);
    card.addEventListener('pointerdown', event => {
      sparkle(event);
      card.classList.add('touch-hot');
    });
    for (const event of ['pointerleave','pointerup','pointercancel']) {
      card.addEventListener(event, () => card.classList.remove('touch-hot'));
    }
    card.addEventListener('toggle', () => {
      if (card.open) {
        for (const sibling of card.parentElement.querySelectorAll('details[open]')) {
          if (sibling !== card) sibling.open = false;
        }
      }
    });
  }
})();
