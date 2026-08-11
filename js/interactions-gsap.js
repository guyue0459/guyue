/* Local interaction preview only — not published. */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.7 });

  gsap.from('.nav__logo, .nav__links > li, .nav__toggle', {
    y: -12,
    autoAlpha: 0,
    stagger: 0.06,
    duration: 0.45,
    clearProps: 'all',
  });

  document.querySelectorAll('.section').forEach((section) => {
    const label = section.querySelector('.section__label');
    const title = section.querySelector('.section__title');
    if (label) gsap.from(label, { x: -18, autoAlpha: 0, scrollTrigger: { trigger: section, start: 'top 78%', once: true } });
    if (title) gsap.from(title, { y: 22, autoAlpha: 0, scrollTrigger: { trigger: section, start: 'top 74%', once: true } });
  });

  const cards = document.querySelectorAll('.work__card');
  ScrollTrigger.batch(cards, {
    start: 'top 85%',
    once: true,
    onEnter: (batch) => gsap.from(batch, { y: 28, autoAlpha: 0, stagger: 0.09, duration: 0.65, clearProps: 'all' }),
  });

  cards.forEach((card) => {
    const image = card.querySelector('.card__img img');
    card.addEventListener('pointerenter', () => {
      gsap.to(card, { y: -8, duration: 0.35, overwrite: 'auto' });
      if (image) gsap.to(image, { scale: 1.045, duration: 0.55, overwrite: 'auto' });
    });
    card.addEventListener('pointerleave', () => {
      gsap.to(card, { y: 0, rotationX: 0, rotationY: 0, duration: 0.45, overwrite: 'auto' });
      if (image) gsap.to(image, { scale: 1, duration: 0.45, overwrite: 'auto' });
    });
    card.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 800) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, { rotationY: x * 1.6, rotationX: y * -1.6, transformPerspective: 900, duration: 0.35, overwrite: 'auto' });
    });
  });
})();
