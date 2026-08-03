/* main.js — mobile nav, certificate viewer, copy-to-clipboard, video facade */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initCertificateViewer();
    initCopyEmail();
    initVideoFacade();
  });

  /* Mobile navigation */
  function initMobileNav() {
    var toggle = document.querySelector('.navbar__toggle');
    var menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (event) {
      if (
        menu.classList.contains('is-open') &&
        !menu.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Certificate viewer */
  function initCertificateViewer() {
    var dataEl = document.getElementById('cert-data');
    var modal = document.querySelector('[data-cert-modal]');
    if (!dataEl || !modal) return;

    var certificates = [];
    try {
      certificates = JSON.parse(dataEl.textContent) || [];
    } catch (e) {
      certificates = [];
    }

    var byId = {};
    certificates.forEach(function (cert) {
      byId[cert.id] = cert;
    });

    var modalImage = document.getElementById('cert-modal-image');
    var modalTitle = document.getElementById('cert-modal-title');
    var modalIssuer = document.getElementById('cert-modal-issuer');
    var modalVerify = document.getElementById('cert-modal-verify');
    var closeBtn = document.querySelector('[data-cert-close]');
    var backdrop = document.querySelector('[data-cert-backdrop]');
    var lastTrigger = null;

    function openModal(cert, trigger) {
      lastTrigger = trigger;
      modalImage.src = cert.imageUrl;
      modalImage.alt =
        cert.title + ' certificate, issued by ' + cert.issuer + ', ' + cert.year;
      modalTitle.textContent = cert.title;
      modalIssuer.textContent = cert.issuer + ' \u00B7 ' + cert.platform + ' \u00B7 ' + cert.year;
      if (cert.verificationUrl) {
        modalVerify.href = cert.verificationUrl;
        modalVerify.style.display = '';
      } else {
        modalVerify.style.display = 'none';
      }
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeModal(returnFocus) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      if (returnFocus && lastTrigger) lastTrigger.focus();
    }

    document.querySelectorAll('.cert-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var cert = byId[card.getAttribute('data-cert-id')];
        if (cert) {
          card.setAttribute('aria-expanded', 'true');
          openModal(cert, card);
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (lastTrigger) lastTrigger.setAttribute('aria-expanded', 'false');
        closeModal(true);
      });
    }
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        if (lastTrigger) lastTrigger.setAttribute('aria-expanded', 'false');
        closeModal(true);
      });
    }
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) {
        if (lastTrigger) lastTrigger.setAttribute('aria-expanded', 'false');
        closeModal(true);
      }
    });
  }

  /* Copy email */
  function initCopyEmail() {
    document.querySelectorAll('[data-copy-email]').forEach(function (button) {
      button.addEventListener('click', function () {
        var email = button.getAttribute('data-copy-email');
        var live = button.closest('.social-card').querySelector('[data-copy-live]');
        var original = button.textContent;

        function done() {
          button.textContent = 'Copied!';
          if (live) live.textContent = 'Email address copied to clipboard.';
          setTimeout(function () {
            button.textContent = original;
            if (live) live.textContent = '';
          }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = email;
          ta.setAttribute('readonly', '');
          ta.style.position = 'absolute';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
          } catch (e) {}
          document.body.removeChild(ta);
          done();
        }
      });
    });
  }

  /* Video facade → iframe */
  function initVideoFacade() {
    document.querySelectorAll('.video-facade').forEach(function (facade) {
      facade.addEventListener('click', function () {
        var id = facade.getAttribute('data-video-id');
        if (!id || facade.classList.contains('is-loaded')) return;
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
        iframe.title = facade.getAttribute('aria-label') || 'Project walkthrough video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        facade.appendChild(iframe);
        facade.classList.add('is-loaded');
      });
    });
  }
})();
