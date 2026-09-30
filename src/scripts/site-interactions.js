// Opacity-only reveals keep every existing transform and collage offset intact.
// Future compositions can opt in with data-reveal / data-reveal-group, or opt
// out with data-reveal="off". Semantic case-study headings/images work by default.
const revealSelectors = [
  '[data-reveal]:not([data-reveal="off"])', '[data-reveal-group] > *',
  'main section > :is(h1,h2,h3,p,blockquote,figure,img)',
  '.section-heading', '.landing > .card', '.wcard', '.stamp', '.note', '.insight',
  '.landing__tagline', '.work-page__tagline', '.about-page__tagline',
  '.hero__photo', '.hero__info-card', '.hero__cta-wrap',
  '.about__tagline', '.about__collage',
  '.about-page__card', '.about-page__banner',
  '.oni-copy', '.fic-copy', '.oni-about-copy', '.fic-about-copy',
  '.oni-market-copy', '.oni-about-photo', '.oni-market-photo', '.fic-about-photo',
  '.oni-title', '.oni-facts', '.fic-facts', '.oni-hero-label', '.fic-hero-label',
  '.oni-persona', '.oni-persona-note', '.oni-quote', '.fic-quote',
  '.oni-ribbons > span', '.fic-ribbons > span',
  '.fic-direction-card', '.fic-swatches > .fic-backed',
  '.fic-impact-cards > .fic-backed', '.fic-specimen', '.footer',
].join(',');

function installInteractions() {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Case-study content is static by default, including future /work/* routes.
  // Navigation is installed independently below.
  const isCaseStudy = /^\/work\/[^/]+/.test(window.location.pathname);
  const candidates = (isCaseStudy ? [] : [...document.querySelectorAll(revealSelectors)])
    .filter(el => !el.closest('nav, [data-reveal="off"], .hero, [data-hero]'))
    .filter(el => !el.matches('.work-page__heading, .work-page__tagline, .about-page__heading, .about-page__tagline, .about-page__card--intro'));
  const candidateSet = new Set(candidates);
  // A composition and its contents must not animate twice. Keep paper, backing,
  // tape, and text together, rather than changing individual decorative layers.
  const targets = candidates.filter(el => {
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      if (candidateSet.has(parent)) return false;
    }
    return true;
  });
  // Synchronize existing Works cards by their visual row without inserting
  // wrappers or changing the absolute-positioned collage layout.
  const rows = [];
  const rowMembers = new Map();
  for (const el of targets.filter(el => el.matches('.work-page .wcard'))) {
    const top = el.getBoundingClientRect().top;
    let row = rows.find(row => Math.abs(row.top - top) < 8);
    if (!row) { row = { top, members:[] }; rows.push(row); }
    row.members.push(el);
  }
  rows.forEach(row => row.members.forEach(el => rowMembers.set(el,row.members)));
  // A heading and its immediate introduction share one start time, without
  // wrapping or repositioning either element.
  for (const heading of targets.filter(el => el.matches('.section-heading, h1, h2, h3'))) {
    const intro = heading.nextElementSibling;
    if (intro?.matches('p') && targets.includes(intro)) {
      const members = [heading,intro];
      members.forEach(el => rowMembers.set(el,members));
    }
  }
  // The collage's empty decorative wrappers have misleading viewport bounds.
  // Start its ordered sequence from the real heading, never those wrappers.
  const aboutSequence = ['.about__heading', '.about__collage']
    .map(selector => targets.find(el => el.matches(selector))).filter(Boolean);
  const aboutTargets = new Set(targets.filter(el => el.closest('.about')));
  const revealed = new Set();
  const animations = new Map();
  const nextRevealByGroup = new Map();
  let observer;

  function stopAnimation(el) {
    animations.get(el)?.cancel();
    animations.delete(el);
  }

  function observeContent() {
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    animations.clear();
    nextRevealByGroup.clear();
    if (isCaseStudy || motion.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting)
        .sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top ||
          a.boundingClientRect.left - b.boundingClientRect.left)
        .flatMap(entry => entry.target === aboutSequence[0]
          ? aboutSequence.map(target => ({ target })) : [entry]);
      entering.forEach(entry => {
        const el = entry.target;
        observer.unobserve(el);
        if (revealed.has(el)) return;
        const members = rowMembers.get(el) || [el];
        members.forEach(member => { observer.unobserve(member); revealed.add(member); });
        if (motion.matches || typeof el.animate !== 'function') return;
        // Keep related elements 1.5 seconds apart even when they enter in
        // separate observer callbacks. Unrelated sections have their own queue.
        const group = el.closest('[data-reveal-group], section, main') || el.parentElement;
        const now = performance.now();
        const startAt = Math.max(now, nextRevealByGroup.get(group) || 0);
        nextRevealByGroup.set(group, startAt + 1500);
        // A finite Web Animation cannot leave content permanently hidden if
        // subsequent JS fails. No inline opacity, transform, or fill-forwards.
        const timelineStart = document.timeline.currentTime;
        members.forEach(member => {
        const opacity = getComputedStyle(member).opacity;
        const animation = member.animate([{opacity:0}, {opacity}], {
          duration:700, delay:startAt - now,
          easing:'ease-out', fill:'backwards',
        });
        if (timelineStart !== null) animation.startTime = timelineStart;
        animations.set(member,animation);
        animation.onfinish = () => stopAnimation(member);
        });
      });
    }, {threshold:0, rootMargin:'0px'});
    targets.forEach(el => {
      if (!revealed.has(el) && (!aboutTargets.has(el) || el === aboutSequence[0])) observer.observe(el);
    });
  }

  const nav = document.querySelector('.nav');
  const canvas = nav?.parentElement;
  const navOffset = nav && canvas
    ? nav.getBoundingClientRect().left - canvas.getBoundingClientRect().left : 0;
  let previousY = Math.max(0,window.scrollY);
  let direction = 0;
  let distance = 0;
  let frame = 0;

  function showNav() {
    if (nav) {
      nav.dataset.scrollNav = 'visible';
      nav.dataset.scrollNavGlass = window.scrollY > 120 ? 'true' : 'false';
    }
  }
  function positionNav() {
    if (nav && canvas) {
      nav.style.setProperty('--scroll-nav-left',`${canvas.getBoundingClientRect().left + navOffset}px`);
    }
  }
  function updateScroll() {
    frame = 0;
    const y = Math.max(0,window.scrollY);
    const delta = y - previousY;
    previousY = y;
    if (y <= 120 || nav?.contains(document.activeElement)) {
      showNav(); distance = 0; direction = 0; return;
    }
    if (!delta) return;
    const nextDirection = Math.sign(delta);
    if (nextDirection !== direction) { direction = nextDirection; distance = 0; }
    distance += Math.abs(delta);
    if (distance >= (direction > 0 ? 18 : 12)) {
      if (direction > 0) {
        if (nav) nav.dataset.scrollNav = 'hidden';
      } else showNav();
      distance = 0;
    }
  }
  function onScroll() {
    if (!frame) frame = requestAnimationFrame(updateScroll);
  }
  function onFocus(event) {
    // Keyboard users never have to wait for a hidden navigation or card.
    if (nav?.contains(event.target)) showNav();
    animations.forEach((animation,el) => {
      if (el.contains(event.target)) stopAnimation(el);
    });
  }

  positionNav();
  showNav();
  if (nav) nav.dataset.scrollNavGlass = 'false';
  observeContent();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',positionNav);
  document.addEventListener('focusin',onFocus);
  motion.addEventListener('change',observeContent);

  return () => {
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll',onScroll);
    window.removeEventListener('resize',positionNav);
    document.removeEventListener('focusin',onFocus);
    motion.removeEventListener('change',observeContent);
    if (nav) {
      delete nav.dataset.scrollNav;
      delete nav.dataset.scrollNavGlass;
      nav.style.removeProperty('--scroll-nav-left');
    }
  };
}

let cleanup;
let activeBody;
function start() {
  // Astro can announce the initial page after this module has already run.
  // Do not restart in-progress fades or reset the reveal history on that page.
  if (activeBody === document.body) return;
  cleanup?.();
  activeBody = document.body;
  cleanup = installInteractions();
}
start();
document.addEventListener('astro:page-load',start);
document.addEventListener('astro:before-swap',() => {
  cleanup?.();
  cleanup = undefined;
  activeBody = undefined;
});
