/* LYRICX — retro arcade music universe */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- toast ---------- */
  var toast = $('#toast'), toastTimer;
  function notify(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2300);
  }

  /* ---------- boot ---------- */
  var boot = $('#boot');
  if (boot) {
    var booted = false;
    try { booted = sessionStorage.getItem('lyricx-booted') === '1'; } catch (e) {}
    if (booted) {
      boot.parentNode.removeChild(boot);
    } else {
      var bootLines = $('#bootLines');
      ['LYRICX SYSTEM v1.0.0', 'MUSIC UNIVERSE LOADED…', 'READY PLAYER ONE.'].forEach(function (line, i) {
        setTimeout(function () {
          if (!bootLines) return;
          var p = document.createElement('p');
          p.textContent = line;
          bootLines.appendChild(p);
        }, 160 + i * 360);
      });
      try { sessionStorage.setItem('lyricx-booted', '1'); } catch (e) {}
      setTimeout(function () {
        boot.classList.add('hide');
        setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 600);
      }, 1750);
    }
  }

  /* ---------- theme ---------- */
  var saved = null;
  try { saved = localStorage.getItem('lyricx-site-theme'); } catch (e) {}
  if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);
  var themeBtn = $('#themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('lyricx-site-theme', next); } catch (e) {}
      notify(next === 'light' ? 'LIGHT MODE ONLINE' : 'DARK MODE ONLINE');
    });
  }

  /* ---------- particles ---------- */
  $$('.particles').forEach(function (box) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 55; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 100) + '%';
      p.style.animationDelay = (Math.random() * 2.6) + 's';
      frag.appendChild(p);
    }
    box.appendChild(frag);
  });

  /* ---------- helpers ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- reveal ---------- */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- navigation ---------- */
  var menuBtn = $('#menuBtn'), links = $('#hudLinks');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    $$('#hudLinks a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        menuBtn.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var backTop = $('#backTop');
  if (backTop) {
    backTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  $$('.magnetic').forEach(function (b) {
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .15) + 'px,' + ((e.clientY - r.top - r.height / 2) * .15) + 'px)';
    });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });

  /* ---------- curated English songs (official artwork, official destination) ---------- */
  var songs = [
    { t: 'Blinding Lights', a: 'The Weeknd', y: '2020', img: 'blinding-lights' },
    { t: 'Starboy', a: 'The Weeknd', y: '2016', img: 'starboy' },
    { t: 'Shape of You', a: 'Ed Sheeran', y: '2017', img: 'shape-of-you' },
    { t: 'Perfect', a: 'Ed Sheeran', y: '2017', img: 'perfect' },
    { t: 'Heat Waves', a: 'Glass Animals', y: '2020', img: 'heat-waves' },
    { t: 'Sweater Weather', a: 'The Neighbourhood', y: '2012', img: 'sweater-weather' },
    { t: 'Yellow', a: 'Coldplay', y: '2000', img: 'yellow' },
    { t: 'The Night We Met', a: 'Lord Huron', y: '2015', img: 'the-night-we-met' },
    { t: 'Another Love', a: 'Tom Odell', y: '2012', img: 'another-love' },
    { t: 'Let Her Go', a: 'Passenger', y: '2012', img: 'let-her-go' },
    { t: 'Die With A Smile', a: 'Bruno Mars & Lady Gaga', y: '2024', img: 'die-with-a-smile' },
    { t: 'Birds of a Feather', a: 'Billie Eilish', y: '2024', img: 'birds-of-a-feather' }
  ];

  var inventory = $('#inventory');
  if (inventory) {
    var limit = parseInt(inventory.getAttribute('data-limit'), 10);
    if (!limit || limit > songs.length) limit = songs.length;

    inventory.innerHTML = songs.slice(0, limit).map(function (s) {
      var url = 'https://music.youtube.com/search?q=' + encodeURIComponent(s.t + ' ' + s.a);
      return '<a class="song-card reveal" href="' + url + '" target="_blank" rel="noopener">' +
        '<div class="cover-wrap"><img src="assets/albums/' + s.img + '.jpg" alt="' + s.t + ' official album cover" loading="lazy"><span class="pixel-music">♪</span></div>' +
        '<h3>' + s.t + '</h3><p class="artist">' + s.a + '</p>' +
        '<div class="song-meta"><span class="year">' + s.y + '</span><span class="year">OFFICIAL</span></div>' +
        '<span class="view-btn">VIEW SONG ▶</span></a>';
    }).join('');

    $$('.song-card', inventory).forEach(function (c) {
      if (io) io.observe(c); else c.classList.add('in');
      c.addEventListener('click', function () { notify('OPENING OFFICIAL MUSIC DESTINATION…'); });
    });
  }

  /* ---------- download page ---------- */
  var appGrid = $('#appGrid');
  if (appGrid) {
    var ua = navigator.userAgent || '';
    var os = /Android/i.test(ua) ? 'android'
      : /Windows/i.test(ua) ? 'windows'
      : /Mac OS X|Macintosh/i.test(ua) ? 'macos'
      : /Linux|X11/i.test(ua) ? 'linux' : '';
    if (os) {
      var card = appGrid.querySelector('[data-os="' + os + '"]');
      if (card) card.classList.add('recommended');
    }
    $$('.app-card .os-btn').forEach(function (a) {
      a.addEventListener('click', function () { notify('STARTING DOWNLOAD…'); });
    });
  }
})();
