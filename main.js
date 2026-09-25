/* ==========================================================================
   AERO/RUN — High-Performance Landing Page Engine
   Interactive Mechanics, Animations & Telemetry Observer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initVideoController();
  initChartreuseDotAnimation();
  initHotspotInteractions();
  initHeroObserver();
  initNavObserver();
  initScrollRevealObserver();
  initAccessibilityListeners();
});

/**
 * 1. Video Loading & Fallback Controller
 */
function initVideoController() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  const remoteVideoUrl = 'https://media.dinamosites.com/library/v1/video/aero-run-loop-e45a8619dfea.mp4';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    video.pause();
    return;
  }

  video.addEventListener('error', () => {
    console.warn('Local video source failed, falling back to remote URL...');
    if (video.src !== remoteVideoUrl) {
      video.src = remoteVideoUrl;
      video.load();
      video.play().catch(err => console.log('Autoplay prevented:', err));
    }
  });

  video.play().catch(err => {
    console.log('Initial autoplay state:', err);
  });
}

/**
 * 2. Chartreuse Dot SVG Path Animation using getPointAtLength
 */
let animFrameId = null;
let pathDistance = 0;
let isAnimationRunning = true;

function initChartreuseDotAnimation() {
  const path = document.getElementById('ellipse-path-primary');
  const dot = document.getElementById('chartreuse-dot');
  const dotCore = document.getElementById('chartreuse-dot-core');

  if (!path || !dot || !dotCore) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    isAnimationRunning = false;
    try {
      const initialPt = path.getPointAtLength(0);
      dot.setAttribute('cx', initialPt.x);
      dot.setAttribute('cy', initialPt.y);
      dotCore.setAttribute('cx', initialPt.x);
      dotCore.setAttribute('cy', initialPt.y);
    } catch (e) {}
    return;
  }

  let totalLength = 0;
  try {
    totalLength = path.getTotalLength();
  } catch (e) {
    return;
  }

  const speed = 0.6;

  function step() {
    if (!isAnimationRunning) return;

    pathDistance = (pathDistance + speed) % totalLength;
    try {
      const point = path.getPointAtLength(pathDistance);
      dot.setAttribute('cx', point.x);
      dot.setAttribute('cy', point.y);
      dotCore.setAttribute('cx', point.x);
      dotCore.setAttribute('cy', point.y);
    } catch (e) {}

    animFrameId = requestAnimationFrame(step);
  }

  animFrameId = requestAnimationFrame(step);
}

/**
 * 3. Interactive Hotspots Controller
 */
function initHotspotInteractions() {
  const hotspotItems = document.querySelectorAll('.hotspot-item');

  hotspotItems.forEach(item => {
    const button = item.querySelector('.hotspot-trigger');
    const card = item.querySelector('.hotspot-card');

    if (!button || !card) return;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = item.classList.contains('active');
      
      hotspotItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          const otherBtn = other.querySelector('.hotspot-trigger');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      if (isActive) {
        item.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
      }
    });

    button.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        item.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hotspot-item')) {
      hotspotItems.forEach(item => {
        item.classList.remove('active');
        const btn = item.querySelector('.hotspot-trigger');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/**
 * 4. IntersectionObserver for Hero Section Video & Dot Loop
 */
function initHeroObserver() {
  const heroSection = document.getElementById('hero');
  const video = document.getElementById('hero-video');

  if (!heroSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (video && video.paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          video.play().catch(() => {});
        }
        if (!isAnimationRunning) {
          isAnimationRunning = true;
          initChartreuseDotAnimation();
        }
      } else {
        if (video && !video.paused) {
          video.pause();
        }
        isAnimationRunning = false;
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
        }
      }
    });
  }, { threshold: 0.1 });

  observer.observe(heroSection);
}

/**
 * 5. Scroll Reveal IntersectionObserver for All Sections
 */
function initScrollRevealObserver() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/**
 * 6. Navigation Active State Observer
 */
function initNavObserver() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.style.color = '#FFFFFF';
          } else {
            link.style.color = '';
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(sec => observer.observe(sec));
}

/**
 * 7. Button Listeners & Scroll Feedback
 */
function initAccessibilityListeners() {
  const btnDiscover = document.getElementById('btn-discover');
  const btnFindSize = document.getElementById('btn-find-size');

  if (btnDiscover) {
    btnDiscover.addEventListener('click', () => {
      const designSection = document.getElementById('diseno');
      if (designSection) {
        designSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (btnFindSize) {
    btnFindSize.addEventListener('click', () => {
      alert('Sizing Assistant: Recommended size is US 10.5 (True to Size for Race Fit).');
    });
  }
}
