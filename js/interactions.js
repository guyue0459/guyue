// ========================================
// SCROLL PROGRESS BAR
// ========================================
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const winScroll = document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  progressBar.style.width = scrolled + '%';
});

// ========================================
// CUSTOM CURSOR (Desktop only)
// ========================================
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice) {
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  const cursorDot = document.createElement('div');
  cursorDot.className = 'custom-cursor__dot';
  document.body.appendChild(cursor);
  document.body.appendChild(cursorDot);
  document.body.classList.add('custom-cursor-active');

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let dotX = 0, dotY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    dotX += (mouseX - dotX) * 0.25;
    dotY += (mouseY - dotY) * 0.25;

    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    cursorDot.style.transform = `translate(${dotX}px, ${dotY}px)`;

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Cursor states
  document.querySelectorAll('a, button, [data-key], .card__img').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// ========================================
// WORK CARD LIGHTBOX
// ========================================
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = `
  <div class="lightbox__overlay"></div>
  <div class="lightbox__content">
    <button class="lightbox__close" aria-label="关闭">×</button>
    <button class="lightbox__nav lightbox__nav--prev" aria-label="上一个">‹</button>
    <button class="lightbox__nav lightbox__nav--next" aria-label="下一个">›</button>
    <div class="lightbox__image-wrap">
      <img class="lightbox__image" src="" alt="" />
      <video class="lightbox__video" controls playsinline preload="metadata"></video>
      <span class="lightbox__counter" aria-live="polite"></span>
    </div>
    <div class="lightbox__info">
      <span class="lightbox__tag"></span>
      <h3 class="lightbox__title"></h3>
      <p class="lightbox__desc"></p>
    </div>
  </div>
`;
document.body.appendChild(lightbox);

const lbOverlay = lightbox.querySelector('.lightbox__overlay');
const lbClose = lightbox.querySelector('.lightbox__close');
const lbPrev = lightbox.querySelector('.lightbox__nav--prev');
const lbNext = lightbox.querySelector('.lightbox__nav--next');
const lbImage = lightbox.querySelector('.lightbox__image');
const lbVideo = lightbox.querySelector('.lightbox__video');
const lbCounter = lightbox.querySelector('.lightbox__counter');
const lbTag = lightbox.querySelector('.lightbox__tag');
const lbTitle = lightbox.querySelector('.lightbox__title');
const lbDesc = lightbox.querySelector('.lightbox__desc');

let currentMediaIndex = 0;
let currentMedia = [];
let activeCard = null;

function updateLightbox() {
  const card = activeCard;
  if (!card) return;

  const tag = card.querySelector('.card__tag');
  const title = card.querySelector('.card__title');
  const desc = card.querySelector('.card__desc');
  const media = currentMedia[currentMediaIndex];

  lbVideo.pause();
  lbVideo.removeAttribute('src');
  lbImage.hidden = media?.type === 'video';
  lbVideo.hidden = media?.type !== 'video';
  if (media?.type === 'video') {
    lbVideo.src = media.src;
    lbVideo.poster = card.querySelector('img')?.src || '';
  } else {
    lbImage.src = media?.src || card.querySelector('img')?.src || '';
    lbImage.alt = title?.textContent || '';
  }
  lbTag.textContent = tag?.textContent || '';
  lbTitle.textContent = title?.textContent || '';
  lbDesc.textContent = desc?.textContent || '';

  const hasMultiple = currentMedia.length > 1;
  lbPrev.style.display = hasMultiple ? '' : 'none';
  lbNext.style.display = hasMultiple ? '' : 'none';
  lbCounter.textContent = hasMultiple ? `${currentMediaIndex + 1} / ${currentMedia.length}` : '';
}

function openLightbox(card) {
  activeCard = card;
  const gallery = (card.dataset.gallery || '').split('|').map(item => item.trim()).filter(Boolean);
  currentMedia = gallery.map(src => ({ type: 'image', src }));
  if (!currentMedia.length) currentMedia.push({ type: 'image', src: card.querySelector('img')?.src || '' });
  const videos = (card.dataset.videos || card.dataset.video || '').split('|').map(item => item.trim()).filter(Boolean);
  currentMedia.push(...videos.map(src => ({ type: 'video', src })));
  currentMediaIndex = 0;
  updateLightbox();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lbVideo.pause();
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

lbOverlay.addEventListener('click', closeLightbox);
lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => {
  if (!currentMedia.length) return;
  currentMediaIndex = (currentMediaIndex - 1 + currentMedia.length) % currentMedia.length;
  updateLightbox();
});
lbNext.addEventListener('click', () => {
  if (!currentMedia.length) return;
  currentMediaIndex = (currentMediaIndex + 1) % currentMedia.length;
  updateLightbox();
});

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft' && currentMedia.length > 1) { currentMediaIndex = (currentMediaIndex - 1 + currentMedia.length) % currentMedia.length; updateLightbox(); }
  if (e.key === 'ArrowRight' && currentMedia.length > 1) { currentMediaIndex = (currentMediaIndex + 1) % currentMedia.length; updateLightbox(); }
});

let swipeStartX = null;
lightbox.addEventListener('touchstart', e => { swipeStartX = e.changedTouches[0]?.clientX ?? null; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  if (swipeStartX === null || currentMedia.length < 2) return;
  const delta = (e.changedTouches[0]?.clientX ?? swipeStartX) - swipeStartX;
  swipeStartX = null;
  if (Math.abs(delta) < 45) return;
  currentMediaIndex = delta < 0
    ? (currentMediaIndex + 1) % currentMedia.length
    : (currentMediaIndex - 1 + currentMedia.length) % currentMedia.length;
  updateLightbox();
}, { passive: true });

// Attach to work cards (only when not in edit mode)
document.getElementById('workGrid').addEventListener('click', e => {
  if (document.body.classList.contains('edit-mode')) return;

  const card = e.target.closest('.work__card');
  if (!card || e.target.closest('.item-delete-btn')) return;

  // Interactive projects have their own live page instead of the image lightbox.
  if (e.target.closest('[data-live-project]')) return;

  const clickedLink = e.target.closest('.card__link');
  const clickedImg = e.target.closest('.card__img');

  if (clickedLink || clickedImg) {
    e.preventDefault();
    openLightbox(card);
  }
});

// ========================================
// 3D CARD TILT
// ========================================
document.querySelectorAll('.work__card').forEach(card => {
  card.addEventListener('mousemove', e => {
    if (document.body.classList.contains('edit-mode')) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ========================================
// MAGNETIC BUTTONS
// ========================================
document.querySelectorAll('.btn, .filter__btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// ========================================
// HERO ROLE ROTATOR
// ========================================
const heroEyebrow = document.querySelector('.hero__eyebrow');
if (heroEyebrow) {
  const roles = ['Visual Designer', 'Illustrator', 'Brand Creator', 'UI Designer', 'Creative Artist'];
  let roleIndex = 0;

  const rotator = document.createElement('span');
  rotator.className = 'hero__role-rotator';
  rotator.textContent = roles[0];

  // Replace content with rotator
  heroEyebrow.innerHTML = '';
  heroEyebrow.appendChild(rotator);

  setInterval(() => {
    rotator.classList.add('fade-out');
    setTimeout(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      rotator.textContent = roles[roleIndex];
      rotator.classList.remove('fade-out');
    }, 300);
  }, 3000);
}
