/* LYRICX — site interactions */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* year */
  $('#year').textContent = new Date().getFullYear();

  /* toast */
  var toast = $('#toast'), toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  /* scroll reveal */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(function (el) { revealObserver.observe(el); });

  /* mobile navigation */
  var menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
  menuBtn.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#navLinks a').forEach(function (a) {
    a.addEventListener('click', function () {
      navLinks.classList.remove('open');
      menuBtn.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* active nav on scroll */
  var sections = $$('main section[id]');
  var navAnchors = $$('#navLinks a');
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      navAnchors.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
      });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach(function (s) { spy.observe(s); });

  /* magnetic buttons */
  $$('.magnetic').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.18;
      var y = (e.clientY - r.top - r.height / 2) * 0.18;
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
  });

  /* play buttons */
  $$('[data-play]').forEach(function (b) {
    b.addEventListener('click', function () {
      notify('Playing “' + b.getAttribute('data-play') + '” — open in LYRICX for the full experience');
    });
  });

  /* lyrics: highlight, copy, favourite */
  $$('#lyricLines p').forEach(function (line) {
    line.addEventListener('click', function () {
      $$('#lyricLines p').forEach(function (p) { p.classList.remove('active'); });
      line.classList.add('active');
    });
  });
  $('#copyLyrics').addEventListener('click', function () {
    var text = $$('#lyricLines p').map(function (p) { return p.textContent; }).join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { notify('Lyrics copied to clipboard'); })
        .catch(function () { notify('Copy unavailable in this browser'); });
    } else { notify('Copy unavailable in this browser'); }
  });
  $('#favLyrics').addEventListener('click', function () {
    var on = this.classList.toggle('on');
    this.setAttribute('aria-pressed', String(on));
    notify(on ? 'Added to favourites' : 'Removed from favourites');
  });

  /* explore dataset */
  var songs = [
    { title: 'Minnalvala', artist: 'Sid Sriram · Jakes Bejoy', genre: 'malayalam', art: 'art-1', glyph: 'L', lyrics: 'minnalvala mand-arayil kaaririkkum njan thanithu' },
    { title: 'Poomuthole', artist: 'Niranj Suresh · Ranjin Raj', genre: 'malayalam', art: 'art-2', glyph: 'M', lyrics: 'poomuthole poovil ninnum oru ganam varunnu' },
    { title: 'Kaathirunnu Njaan', artist: 'K.S. Chithra · M. Jayachandran', genre: 'malayalam', art: 'art-4', glyph: 'K', lyrics: 'kaathirunnu njaan ninne kaathirunnu' },
    { title: 'Varnajaalam', artist: 'Sid Sriram · Vishnu Vijay', genre: 'malayalam', art: 'art-3', glyph: 'S', lyrics: 'varnajaalam nee ennil chithariyathu' },
    { title: 'Midnight City', artist: 'M83', genre: 'english', art: 'art-1', glyph: 'M', lyrics: 'the city is my church, it wraps me in its light' },
    { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'english', art: 'art-2', glyph: 'B', lyrics: 'i said ooh, i said ooh, i said ooh' },
    { title: 'Sunflower', artist: 'Post Malone · Swae Lee', genre: 'english', art: 'art-4', glyph: 'S', lyrics: 'a sunflower, a little bitty flower growing in the dark' },
    { title: 'Kaantha', artist: 'Sid Sriram', genre: 'chill', art: 'art-5', glyph: 'K', lyrics: 'kaantha ninte kanavil njan varum' },
    { title: 'Rainy Lofi', artist: 'LYRICX Sessions', genre: 'chill', art: 'art-3', glyph: 'R', lyrics: 'rain on the window, silence in the room' },
    { title: 'Tum Hi Ho', artist: 'Arijit Singh', genre: 'bollywood', art: 'art-2', glyph: 'T', lyrics: 'tum hi ho, tum hi ho, tum hi ho' }
  ];

  var mode = 'song', genre = 'all', query = '';
  var results = $('#results');

  function render() {
    var q = query.toLowerCase().trim();
    var list = songs.filter(function (s) {
      if (genre !== 'all' && s.genre !== genre) return false;
      if (!q) return true;
      if (mode === 'song') return s.title.toLowerCase().indexOf(q) > -1 || s.artist.toLowerCase().indexOf(q) > -1;
      if (mode === 'artist') return s.artist.toLowerCase().indexOf(q) > -1;
      return s.lyrics.toLowerCase().indexOf(q) > -1 || s.title.toLowerCase().indexOf(q) > -1;
    });
    if (!list.length) { results.innerHTML = '<p class="empty">No lyrics found. Try a different search.</p>'; return; }
    results.innerHTML = list.map(function (s) {
      return '<button class="result" data-title="' + s.title.replace(/"/g, '&quot;') + '">' +
        '<span class="art ' + s.art + '"><span class="art-glyph">' + s.glyph + '</span></span>' +
        '<span class="r-meta"><strong>' + s.title + '</strong><span>' + s.artist + '</span><span class="r-genre">' + s.genre + '</span></span>' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6336C9" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>' +
        '</button>';
    }).join('');
    $$('.result', results).forEach(function (b) {
      b.addEventListener('click', function () { notify('“' + b.getAttribute('data-title') + '” — open LYRICX to read along'); });
    });
  }
  render();

  $('#lyricSearch').addEventListener('input', function () { query = this.value; render(); });
  $$('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.tab').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      t.classList.add('active'); t.setAttribute('aria-selected', 'true');
      mode = t.getAttribute('data-mode'); render();
    });
  });
  $$('.filter').forEach(function (f) {
    f.addEventListener('click', function () {
      $$('.filter').forEach(function (x) { x.classList.remove('active'); });
      f.classList.add('active'); genre = f.getAttribute('data-genre'); render();
    });
  });

  $('#searchJump').addEventListener('click', function () {
    $('#explore').scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () { $('#lyricSearch').focus(); }, 500);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault(); $('#searchJump').click();
    }
  });
})();
