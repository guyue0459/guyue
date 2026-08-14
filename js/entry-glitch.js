(() => {
  const screen = document.querySelector('#entryScreen');
  const glitch = document.querySelector('.entry-glitch');
  const status = document.querySelector('#entryStatus');
  const skip = document.querySelector('#entrySkip');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finished = false;

  if (!screen || !glitch || !status || !skip) return;

  function finish() {
    if (finished) return;
    finished = true;
    screen.classList.add('entry-screen--leave');
    window.setTimeout(() => screen.remove(), 560);
  }

  function pulse() {
    if (finished) return;
    status.textContent = 'SIGNAL DISTORTION';
    glitch.classList.remove('entry-glitch--active');
    void glitch.offsetWidth;
    glitch.classList.add('entry-glitch--active');
    window.setTimeout(() => {
      glitch.classList.remove('entry-glitch--active');
      status.textContent = 'SIGNAL STABLE';
    }, 260);
  }

  skip.addEventListener('click', finish);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Enter') finish();
  }, { once: true });

  if (reduceMotion) {
    window.setTimeout(finish, 380);
    return;
  }

  window.setTimeout(pulse, 420);
  window.setTimeout(pulse, 1450);
  window.setTimeout(finish, 2950);
})();
