/**
 * SparkHeim Games – Scroll Reveal
 * Intersection Observer for soft fade-in animations on scroll
 * Timing: 600-800ms ease-out, 20px upward drift
 */

(function () {
  'use strict';

  const REVEAL_CLASS = 'revealed';
  const REVEAL_THRESHOLD = 0.15; // Trigger when 15% of element is visible
  const REVEAL_ROOT_MARGIN = '0px 0px -40px 0px'; // Slight offset from bottom

  /**
   * Initialize scroll reveal for all [data-reveal] elements
   */
  function initScrollReveal() {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(REVEAL_CLASS);
            // Optional: unobserve after reveal to improve performance
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: REVEAL_THRESHOLD,
        rootMargin: REVEAL_ROOT_MARGIN,
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }
})();
