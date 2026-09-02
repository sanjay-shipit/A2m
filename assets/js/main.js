/* Adtomate Solutions — site interactions */
(function () {
  'use strict';

  var doc = document;

  /* ---------- Footer year ---------- */
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Nav: elevate on scroll ---------- */
  var nav = doc.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var toggle = doc.getElementById('navToggle');
  var menu = doc.getElementById('mobileMenu');
  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    doc.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 680) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- Scroll reveals ---------- */
  var reveals = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up metrics ---------- */
  var counters = Array.prototype.slice.call(doc.querySelectorAll('.metric__val[data-count]'));
  function fmt(el, val) {
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    return pre + val.toFixed(dec) + suf;
  }
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    if (reduce) { el.textContent = fmt(el, target); return; }
    var dur = 1500, start = null;
    (function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(el, target);
    })(performance.now ? performance.now() : Date.now());
  }
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = fmt(el, parseFloat(el.getAttribute('data-count'))); });
    } else {
      var cio = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { runCount(entry.target); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav__links a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return doc.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Booking form → WhatsApp handoff + best-effort Firestore ---------- */
  var bform = doc.getElementById('bookingForm');
  if (bform) {
    var success = doc.getElementById('bookingSuccess');
    var successName = doc.getElementById('successName');
    var successWa = doc.getElementById('successWa');
    var resetBtn = doc.getElementById('bookingReset');
    var WA_NUMBER = '919667796730';

    bform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!bform.checkValidity()) { bform.reportValidity(); return; }

      var val = function (id) { var el = doc.getElementById(id); return el ? el.value.trim() : ''; };
      var lead = {
        name: val('bf-name'),
        business: val('bf-biz'),
        phone: val('bf-phone'),
        email: val('bf-email'),
        service: val('bf-service'),
        message: val('bf-msg')
      };

      // Save the lead to Firebase if available — never block the handoff.
      try { if (window.AdtomateSaveLead) { window.AdtomateSaveLead(lead).catch(function () {}); } } catch (err) {}

      // Compose a prefilled WhatsApp message.
      var lines = [
        "Hi Adtomate, I'd like to book a free consultation.", '',
        'Name: ' + lead.name,
        'Business: ' + (lead.business || '—'),
        'Phone: ' + lead.phone,
        'Email: ' + lead.email,
        'Service: ' + lead.service
      ];
      if (lead.message) lines.push('Message: ' + lead.message);
      var wa = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));

      window.open(wa, '_blank', 'noopener');

      if (successName) successName.textContent = lead.name ? ', ' + lead.name.split(' ')[0] : '';
      if (successWa) successWa.setAttribute('href', wa);
      bform.hidden = true;
      if (success) success.hidden = false;
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (success) success.hidden = true;
        bform.hidden = false;
        bform.reset();
      });
    }
  }
})();
