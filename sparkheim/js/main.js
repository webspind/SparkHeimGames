/**
 * SparkHeim Games – Main JavaScript
 * Nav scroll behavior, stat counters, smooth scroll
 */

(function () {
  'use strict';

  // ---------- Nav: add border/background on scroll ----------
  const nav = document.getElementById('nav');
  if (nav) {
    let lastScroll = 0;
    const scrollThreshold = 50;

    function handleNavScroll() {
      const currentScroll = window.scrollY || window.pageYOffset;
      if (currentScroll > scrollThreshold) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    // Check initial state
    handleNavScroll();
  }

  // ---------- Mobile hamburger menu ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const open = navLinks.classList.toggle('nav__links--open');
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav__links--open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Back to top ----------
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('back-to-top--visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------- Smooth scroll for anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- Stat counters (optional subtle animation) ----------
  const statValues = document.querySelectorAll('[data-stat]');
  if (statValues.length && 'IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-stat'), 10);
            if (isNaN(target)) return;
            animateValue(el, 0, target, 1200);
            statObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    statValues.forEach((el) => statObserver.observe(el));
  }

  /**
   * Animate a number from start to end over duration (ms)
   */
  function animateValue(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2); // ease-out quad
      const current = Math.round(start + (end - start) * eased);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = end;
      }
    }
    requestAnimationFrame(update);
  }
})();
