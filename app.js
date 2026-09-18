/* Rakhaa Investments — interaction layer
   Sections: i18n · header/nav · reveals · counters · parallax
             service preview · magnetic buttons · cursor · form            */
(function () {
  'use strict';

  var DICT = window.RAKHAA_I18N || { ar: {}, en: {} };
  var STORE = 'rakhaa.lang';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var html = document.documentElement;
  var body = document.body;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ------------------------------------------------------------ i18n */
  /* Language has to survive navigation across the static pages. A cookie does
     that and stays available in sandboxed embeds, where Web Storage is not.
     Where even cookies are blocked, internal links carry ?lang= instead. */
  function readStore() {
    /* Reading document.cookie throws outright inside a sandboxed iframe, which
       would take the whole interaction layer down with it. */
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + STORE + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) { return ''; }
  }
  function writeStore(v) {
    try {
      document.cookie = STORE + '=' + encodeURIComponent(v) +
        ';path=/;max-age=31536000;samesite=lax';
    } catch (e) { /* noop */ }
    return readStore() === v;
  }
  var storeWorks = true;

  var lang = 'ar';
  var qLang = (location.search.match(/[?&]lang=(ar|en)\b/) || [])[1];
  var cLang = readStore();
  if (qLang) lang = qLang;
  else if (cLang === 'ar' || cLang === 'en') lang = cLang;

  function tr(key) {
    var d = DICT[lang] || {};
    return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : (DICT.ar[key] || '');
  }

  function applyLang(next, animate) {
    lang = next;
    var rtl = lang === 'ar';
    html.setAttribute('lang', lang);
    html.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    body.classList.toggle('is-ltr', !rtl);
    body.classList.toggle('is-rtl', rtl);

    $$('[data-i18n]').forEach(function (el) {
      var v = tr(el.getAttribute('data-i18n'));
      if (v) el.textContent = v;
    });
    $$('[data-i18n-html]').forEach(function (el) {
      var v = tr(el.getAttribute('data-i18n-html'));
      if (v) el.innerHTML = v;
    });
    $$('[data-i18n-words]').forEach(function (el) {
      var v = tr(el.getAttribute('data-i18n-words'));
      if (!v) return;
      var base = parseInt(el.getAttribute('data-word-offset') || '0', 10);
      el.innerHTML = v.split(/\s+/).map(function (w, i) {
        return '<span class="w" style="--wi:' + (base + i) + '">' + w + '</span>';
      }).join(' ');
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (part) {
        var bits = part.split(':');
        if (bits.length !== 2) return;
        var v = tr(bits[1].trim());
        if (v) el.setAttribute(bits[0].trim(), v);
      });
    });

    var langBtn = $('#langToggle');
    if (langBtn) langBtn.setAttribute('lang', rtl ? 'en' : 'ar');
    var fLang = $('#fLang');
    if (fLang) fLang.value = lang;

    storeWorks = writeStore(lang);
    /* Cookies blocked: keep the choice in the links so it survives a click. */
    if (!storeWorks) {
      $$('a[href]').forEach(function (a) {
        var h = a.getAttribute('href');
        if (!h || /^(https?:|mailto:|tel:|#)/i.test(h) || /\.pdf(\?|#|$)/i.test(h)) return;
        var parts = h.split('#');
        var base = parts[0].replace(/([?&])lang=(ar|en)&?/, '$1').replace(/[?&]$/, '');
        if (!base) return;
        a.setAttribute('href', base + (base.indexOf('?') > -1 ? '&' : '?') + 'lang=' + lang +
          (parts[1] ? '#' + parts[1] : ''));
      });
    }
    document.dispatchEvent(new CustomEvent('rakhaa:lang', { detail: { lang: lang } }));

    if (animate && !reduce) {
      body.style.transition = 'opacity .28s ease';
      body.style.opacity = '0.35';
      window.setTimeout(function () { body.style.opacity = '1'; }, 40);
      window.setTimeout(function () { body.style.transition = ''; }, 420);
    }
  }

  /* Set word offsets so the vision reveal keeps its stagger after a swap. */
  $$('[data-i18n-words]').forEach(function (el) {
    var first = el.querySelector('.w');
    el.setAttribute('data-word-offset', first ? (first.style.getPropertyValue('--wi') || '0') : '0');
  });

  applyLang(lang, false);

  var toggle = $('#langToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      applyLang(lang === 'ar' ? 'en' : 'ar', true);
    });
  }

  /* ------------------------------------------------------------ header */
  var header = $('#siteHeader');
  var burger = $('#burger');
  var mobileNav = $('#mobileNav');
  var toTop = $('#toTop');
  var lightHeader = !$('.hero') && !$('.page-hero');

  if (header && lightHeader) header.classList.add('is-light');

  function onScroll() {
    var y = window.pageYOffset || html.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > 24);
    if (toTop) toTop.classList.toggle('is-on', y > 700);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setNav(open) {
    body.classList.toggle('nav-open', open);
    body.style.overflow = open ? 'hidden' : '';
    if (burger) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', tr(open ? 'nav_close' : 'nav_menu'));
    }
    if (mobileNav) mobileNav.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setNav(!body.classList.contains('nav-open'));
    });
  }
  if (mobileNav) {
    $$('a', mobileNav).forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) {
      setNav(false);
      if (burger) burger.focus();
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1023 && body.classList.contains('nav-open')) setNav(false);
  });

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------ reveals */
  var revealables = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in', 'is-revealed'); });
  } else {
    var pending = revealables.slice();
    var show = function (el) {
      el.classList.add('is-in', 'is-revealed');
      var i = pending.indexOf(el);
      if (i !== -1) pending.splice(i, 1);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        show(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });

    /* Safety net: an instant jump (anchor link, End key, trackpad flick) can
       skip past a section between frames and outrun the observer, which would
       leave that section invisible for good. Reveal anything at or above the
       fold, so content can never stay hidden once it has been scrolled past. */
    var sweeping = false;
    var sweep = function () {
      sweeping = false;
      if (!pending.length) return;
      var vh = window.innerHeight;
      pending.slice().forEach(function (el) {
        if (el.getBoundingClientRect().top < vh * 0.92) { show(el); io.unobserve(el); }
      });
    };
    var queueSweep = function () {
      if (sweeping) return;
      sweeping = true;
      window.requestAnimationFrame(sweep);
    };
    window.addEventListener('scroll', queueSweep, { passive: true });
    window.addEventListener('resize', queueSweep);
    window.addEventListener('load', queueSweep);
    queueSweep();
  }

  /* ------------------------------------------------------------ counters */
  var counters = $$('.counter');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-to')) || 0;
    if (reduce) { el.textContent = String(target); return; }
    var dur = 1500;
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      var waiting = counters.slice();
      var fire = function (el) {
        var i = waiting.indexOf(el);
        if (i === -1) return;
        waiting.splice(i, 1);
        cio.unobserve(el);
        runCounter(el);
      };
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) fire(en.target); });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });

      /* A counter the observer misses would sit at 0 and read as a fake
         statistic, so also fire any that have reached the fold. */
      var cSweeping = false;
      var cSweep = function () {
        cSweeping = false;
        if (!waiting.length) return;
        var vh = window.innerHeight;
        waiting.slice().forEach(function (el) {
          if (el.getBoundingClientRect().top < vh * 0.9) fire(el);
        });
      };
      window.addEventListener('scroll', function () {
        if (cSweeping) return;
        cSweeping = true;
        window.requestAnimationFrame(cSweep);
      }, { passive: true });
      cSweep();
    }
  }

  /* ------------------------------------------------------------ parallax */
  var layers = $$('[data-parallax]');
  if (layers.length && !reduce) {
    var ticking = false;
    function parallax() {
      var vh = window.innerHeight;
      layers.forEach(function (layer) {
        var img = layer.querySelector('img');
        if (!img) return;
        var r = layer.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var amount = parseFloat(layer.getAttribute('data-parallax')) || 0.12;
        var progress = (r.top + r.height / 2 - vh / 2) / vh;
        var shift = -progress * r.height * amount;
        img.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(parallax); }
    }, { passive: true });
    window.addEventListener('resize', parallax);
    parallax();
  }

  /* ------------------------------------------------- service hover preview */
  var list = $('#svcList');
  var preview = $('#svcPreview');
  if (list && preview && fine && !reduce) {
    var px = 0, py = 0, cx = 0, cy = 0, raf = null, active = false;
    function loop() {
      cx += (px - cx) * 0.14;
      cy += (py - cy) * 0.14;
      preview.style.transform =
        'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%)' +
        (active ? ' scale(1)' : ' scale(.9)');
      raf = active ? window.requestAnimationFrame(loop) : null;
    }
    $$('.svc', list).forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var key = row.getAttribute('data-preview');
        $$('img', preview).forEach(function (img) {
          img.classList.toggle('is-active', img.getAttribute('data-key') === key);
        });
        preview.classList.add('is-on');
        active = true;
        if (!raf) raf = window.requestAnimationFrame(loop);
      });
      row.addEventListener('mouseleave', function () {
        preview.classList.remove('is-on');
        active = false;
      });
    });
    list.addEventListener('mousemove', function (e) {
      px = e.clientX; py = e.clientY;
      if (cx === 0 && cy === 0) { cx = px; cy = py; }
    });
  }

  /* ------------------------------------------------------------ magnetic */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = 'translate(' + (dx * 6).toFixed(2) + 'px,' + (dy * 5).toFixed(2) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
        el.style.transform = '';
        window.setTimeout(function () { el.style.transition = ''; }, 520);
      });
    });
  }

  /* ------------------------------------------------------------ cursor */
  if (fine && !reduce) {
    var dot = $('.cursor-dot');
    var ring = $('.cursor-ring');
    if (dot && ring) {
      var mx = window.innerWidth / 2, my = window.innerHeight / 2;
      var rx = mx, ry = my;
      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        body.classList.add('cursor-ready');
        dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
      }, { passive: true });
      (function ringLoop() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0) translate(-50%,-50%)';
        window.requestAnimationFrame(ringLoop);
      }());
      document.addEventListener('mouseover', function (e) {
        var t = e.target;
        var media = t.closest('[data-cursor="media"], .ed-item, picture, .map-frame');
        var link = t.closest('a, button, input, select, textarea, .lib-tab');
        body.classList.toggle('cursor-media', !!media);
        body.classList.toggle('cursor-hover', !!link && !media);
      });
      document.addEventListener('mouseleave', function () {
        body.classList.remove('cursor-ready');
      });
    }
  }

  /* ------------------------------------------------------------ form */
  var form = $('#contactForm');
  if (form) {
    var status = $('#formStatus');
    var submit = $('#formSubmit');
    var submitLabel = submit ? submit.querySelector('span') : null;

    function say(msgKey, isError) {
      if (!status) return;
      status.textContent = tr(msgKey);
      status.setAttribute('data-i18n', msgKey);
      status.classList.add('is-shown');
      status.classList.toggle('is-error', !!isError);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      /* Flag the offending fields and say what is missing. Reusing the
         send-failure message here would wrongly blame the network. */
      var fields = form.querySelectorAll('input, select, textarea');
      var i;
      for (i = 0; i < fields.length; i++) {
        fields[i].setAttribute('aria-invalid', fields[i].checkValidity() ? 'false' : 'true');
      }
      if (!form.checkValidity()) {
        var bad = form.querySelector(':invalid');
        if (bad) bad.focus();
        say('f_invalid', true);
        return;
      }
      if (submit) submit.disabled = true;
      if (submitLabel) {
        submitLabel.setAttribute('data-i18n', 'f_sending');
        submitLabel.textContent = tr('f_sending');
      }
      if (status) status.classList.remove('is-shown', 'is-error');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('bad response');
        form.reset();
        var fl = $('#fLang');
        if (fl) fl.value = lang;
        say('f_ok', false);
      }).catch(function () {
        say('f_err', true);
      }).then(function () {
        if (submit) submit.disabled = false;
        if (submitLabel) {
          submitLabel.setAttribute('data-i18n', 'f_submit');
          submitLabel.textContent = tr('f_submit');
        }
      });
    });
  }

  /* --------------------------------------------- smooth in-page anchors */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    var hash = href.indexOf('#') === 0 ? href : null;
    if (!hash || hash === '#') return;
    var target = document.getElementById(hash.slice(1));
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset -
      (parseInt(getComputedStyle(html).getPropertyValue('--header-h'), 10) || 84) - 8;
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', hash);
  });

  window.RakhaaLang = { get: function () { return lang; }, tr: tr, apply: applyLang };
}());
