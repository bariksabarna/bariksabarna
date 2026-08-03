/* motion.js — scroll reveals, stat counters, avatar reactivity */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initReveals();
    initCounters();
    initAvatarReactivity();
  });

  /* IntersectionObserver-driven reveals */
  function initReveals() {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* Stat counter animation */
  function initCounters() {
    var counters = document.querySelectorAll('.counter[data-target]');
    if (!counters.length) return;

    if (reduceMotion) {
      counters.forEach(function (el) {
        el.textContent = el.getAttribute('data-target');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-target'), 10) || 0;
          var start = null;
          var duration = 1600;

          function step(timestamp) {
            if (start === null) start = timestamp;
            var progress = Math.min((timestamp - start) / duration, 1);
            el.textContent = Math.round(progress * target);
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target;
          }

          requestAnimationFrame(step);
          observer.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* Subtle parallax on the hero avatar (progressive enhancement) */
  function initAvatarReactivity() {
    if (reduceMotion || window.matchMedia('(max-width: 767px)').matches) return;
    var hero = document.querySelector('.hero');
    var photo = document.querySelector('.hero .avatar-frame__photo');
    var blob = document.querySelector('.hero .avatar-frame__blob');
    if (!hero || !photo) return;

    var strength = 8;
    hero.addEventListener('pointermove', function (event) {
      var rect = hero.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      if (blob) {
        blob.style.translate = x * strength * -1 + 'px ' + (y * strength * -1) + 'px';
      }
      photo.style.translate = x * strength + 'px ' + (y * strength) + 'px';
    });

    hero.addEventListener('pointerleave', function () {
      if (blob) blob.style.translate = '0 0';
      photo.style.translate = '0 0';
    });
  }
})();
