/* LYRICX — retro arcade site interactions */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REL = 'https://github.com/cryptixdc/lyricx/releases/latest/download/';

  /* ---------- boot sequence ---------- */
  var bootLines = $('#bootLines');
  var bootText = ['BOOTING LYRICX SYSTEM…', 'MUSIC WORLD LOADED…', 'WELCOME TO LYRICX.'];
  bootText.forEach(function (line, i) {
    setTimeout(function () {
      var p = document.createElement('p');
      p.textContent = line;
      bootLines.appendChild(p);
    }, 180 + i * 380);
  });
  setTimeout(function () { $('#boot').classList.add('hide'); }, 1800);

  /* ---------- pixel stars ---------- */
  var stars = $('#stars'), frag = document.createDocumentFragment();
  for (var i = 0; i < 60; i++) {
    var s = document.createElement('i');
    s.style.left = (Math.random() * 100) + '%';
    s.style.top = (Math.random() * 100) + '%';
    s.style.animationDelay = (Math.random() * 2.4) + 's';
    frag.appendChild(s);
  }
  stars.appendChild(frag);

  /* ---------- year / toast ---------- */
  $('#year').textContent = new Date().getFullYear();
  var toast = $('#toast'), toastTimer;
  function notify(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }

  /* ---------- scroll reveal ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- nav ---------- */
  var menuBtn = $('#menuBtn'), links = $('#hudLinks');
  menuBtn.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#hudLinks a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open'); menuBtn.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      $$('#hudLinks a').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
      });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  $$('main section[id]').forEach(function (s) { spy.observe(s); });

  $('#searchJump').addEventListener('click', function () {
    $('#explore').scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () { $('#lyricSearch').focus(); }, 450);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#searchJump').click(); }
  });
  $('#backTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* magnetic */
  $$('.magnetic').forEach(function (b) {
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .16) + 'px,' + ((e.clientY - r.top - r.height / 2) * .16) + 'px)';
    });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });

  /* ---------- data ---------- */
  var songs = [
    { t: 'Minnalvala', a: 'Sid Sriram · Jakes Bejoy', g: 'malayalam', art: 'art-1', gl: 'L', l: 'minnalvala mand-arayil kaaririkkum njan thanithu' },
    { t: 'Poomuthole', a: 'Niranj Suresh · Ranjin Raj', g: 'malayalam', art: 'art-2', gl: 'M', l: 'poomuthole poovil ninnum oru ganam varunnu' },
    { t: 'Kaathirunnu Njaan', a: 'K.S. Chithra · M. Jayachandran', g: 'malayalam', art: 'art-4', gl: 'K', l: 'kaathirunnu njaan ninne kaathirunnu' },
    { t: 'Varnajaalam', a: 'Sid Sriram · Vishnu Vijay', g: 'malayalam', art: 'art-3', gl: 'V', l: 'varnajaalam nee ennil chithariyathu' },
    { t: 'Midnight City', a: 'M83', g: 'english', art: 'art-1', gl: 'M', l: 'the city is my church, it wraps me in its light' },
    { t: 'Blinding Lights', a: 'The Weeknd', g: 'english', art: 'art-2', gl: 'B', l: 'i said ooh, i said ooh, i said ooh' },
    { t: 'Sunflower', a: 'Post Malone · Swae Lee', g: 'english', art: 'art-4', gl: 'S', l: 'a sunflower growing in the dark' },
    { t: 'Kaantha', a: 'Sid Sriram', g: 'chill', art: 'art-5', gl: 'K', l: 'kaantha ninte kanavil njan varum' },
    { t: 'Rainy Lofi', a: 'LYRICX Sessions', g: 'chill', art: 'art-3', gl: 'R', l: 'rain on the window, silence in the room' },
    { t: 'Tum Hi Ho', a: 'Arijit Singh', g: 'bollywood', art: 'art-2', gl: 'T', l: 'tum hi ho, tum hi ho, tum hi ho' }
  ];
  var artists = [
    { n: 'SID SRIRAM', ini: 'SS', count: '128 TRACKS', art: 'art-1' },
    { n: 'JAKES BEJOY', ini: 'JB', count: '94 TRACKS', art: 'art-2' },
    { n: 'K.S. CHITHRA', ini: 'KC', count: '210 TRACKS', art: 'art-4' }
  ];

  /* ---------- explore ---------- */
  var mode = 'song', genre = 'all', query = '', results = $('#results');
  function renderResults() {
    var q = query.toLowerCase().trim();
    var list = songs.filter(function (s) {
      if (genre !== 'all' && s.g !== genre) return false;
      if (!q) return true;
      if (mode === 'song') return (s.t + ' ' + s.a).toLowerCase().indexOf(q) > -1;
      if (mode === 'artist') return s.a.toLowerCase().indexOf(q) > -1;
      return s.l.indexOf(q) > -1 || s.t.toLowerCase().indexOf(q) > -1;
    });
    if (!list.length) { results.innerHTML = '<p class="empty">NO RESULTS FOUND — TRY AGAIN.</p>'; return; }
    results.innerHTML = list.map(function (s, i) {
      return '<article class="card-item">' +
        '<div class="item-top"><span class="mini-art ' + s.art + '">' + s.gl + '</span>' +
        '<div><h3>' + s.t + '</h3><p class="artist">' + s.a + '</p></div></div>' +
        '<span class="category">' + s.g.toUpperCase() + '</span>' +
        '<button class="view-btn" data-i="' + songs.indexOf(s) + '">VIEW LYRICS ▶</button></article>';
    }).join('');
    $$('.view-btn', results).forEach(function (b) {
      b.addEventListener('click', function () {
        var s = songs[+b.getAttribute('data-i')];
        loadTrack(s); $('#lyrics').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
  renderResults();
  $('#lyricSearch').addEventListener('input', function () { query = this.value; renderResults(); });
  $$('.mode').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.mode').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      t.classList.add('active'); t.setAttribute('aria-selected', 'true'); mode = t.dataset.mode; renderResults();
    });
  });
  $$('.genre').forEach(function (g) {
    g.addEventListener('click', function () {
      $$('.genre').forEach(function (x) { x.classList.remove('active'); });
      g.classList.add('active'); genre = g.dataset.genre; renderResults();
    });
  });

  /* ---------- leaderboard ---------- */
  var ranks = [
    { s: songs[0], score: 98 }, { s: songs[1], score: 91 }, { s: songs[3], score: 86 },
    { s: songs[4], score: 77 }, { s: songs[5], score: 69 }
  ];
  $('#leaderboard').innerHTML = ranks.map(function (r, i) {
    return '<div class="lb-row' + (i < 3 ? ' top' : '') + '">' +
      '<span class="lb-rank">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<div class="lb-track"><span class="mini-art ' + r.s.art + '">' + r.s.gl + '</span><div><strong>' + r.s.t + '</strong><span>' + r.s.a + '</span></div></div>' +
      '<div class="lb-pop"><div class="lb-bar"><i style="width:' + r.score + '%"></i></div><span class="lb-score">' + r.score + 'K</span></div></div>';
  }).join('');

  /* ---------- roster ---------- */
  $('#roster').innerHTML = artists.map(function (a, i) {
    return '<article class="character' + (i === 0 ? ' selected' : '') + '">' +
      '<div class="portrait ' + a.art + '">' + a.ini + '</div>' +
      '<h3>' + a.n + '</h3><p class="meta">' + a.count + '</p>' +
      '<button class="char-btn">EXPLORE PROFILE ▶</button></article>';
  }).join('');
  $$('.character').forEach(function (c) {
    c.addEventListener('click', function () {
      $$('.character').forEach(function (x) { x.classList.remove('selected'); });
      c.classList.add('selected');
      notify('PROFILE LOADED: ' + $('h3', c).textContent);
    });
  });

  /* ---------- dialogue / lyrics ---------- */
  var tracks = [
    { t: 'MINNALVALA', a: 'JAKES BEJOY · SID SRIRAM · SITHARA KRISHNAKUMAR', art: 'art-1', gl: 'L', lines: [
      'Neenjaya kaadhalin nodalil', 'Nilaavil ninnum varum', 'Minnalvala mand-arayil', 'Kaaririkkum njan thanithu', 'Nin sahavasam thedi'
    ] },
    { t: 'POOMUTHOLE', a: 'RANJIN RAJ · NIRANJ SURESH', art: 'art-2', gl: 'M', lines: [
      'Poomuthole poovil ninnum', 'Oru ganam varunnu', 'Manasin makalil', 'Nin namam convernnil', 'Thottu thottu nee'
    ] },
    { t: 'KAATHIRUNNU NJAAN', a: 'M. JAYACHANDRAN · K.S. CHITHRA', art: 'art-4', gl: 'K', lines: [
      'Kaathirunnu njaan ninne', 'Kaathirunnu njaan', 'Vaanam kizhiyum neram', 'Nin pirivu kandu', 'Njan urangippoya'
    ] }
  ];
  var current = 0;
  function drawLyric() {
    var t = tracks[current];
    $('#dTitle').textContent = t.t; $('#dArtist').textContent = t.a;
    var art = $('.dialogue-top .mini-art');
    art.className = 'mini-art ' + t.art; art.textContent = t.gl;
    $('#lyricLines').innerHTML = t.lines.map(function (l, i) {
      return '<p class="' + (i === 2 ? 'active' : '') + '">' + l + '</p>';
    }).join('');
    $('#trackCount').textContent = 'TRACK 0' + (current + 1) + ' / 0' + tracks.length;
    $$('#lyricLines p').forEach(function (p) {
      p.addEventListener('click', function () {
        $$('#lyricLines p').forEach(function (x) { x.classList.remove('active'); });
        p.classList.add('active');
      });
    });
  }
  function loadTrack(song) {
    var i = tracks.findIndex(function (t) { return t.t.toLowerCase() === song.t.toLowerCase(); });
    if (i > -1) { current = i; drawLyric(); }
  }
  drawLyric();
  $('#prevTrack').addEventListener('click', function () { current = (current - 1 + tracks.length) % tracks.length; drawLyric(); });
  $('#nextTrack').addEventListener('click', function () { current = (current + 1) % tracks.length; drawLyric(); });
  $('#copyLyrics').addEventListener('click', function () {
    var text = $$('#lyricLines p').map(function (p) { return p.textContent.replace('▶ ', ''); }).join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { notify('LYRICS COPIED!'); });
    else notify('COPY NOT SUPPORTED HERE');
  });
  $('#favLyrics').addEventListener('click', function () {
    var on = this.classList.toggle('on'); this.setAttribute('aria-pressed', String(on));
    notify(on ? 'ADDED TO FAVOURITES' : 'REMOVED FROM FAVOURITES');
  });

  /* ---------- download ---------- */
  $('#macIntel').href = REL + 'LYRICX-1.0.0-x64.dmg';
  $('#linuxDeb').href = REL + 'LYRICX-1.0.0-linux-amd64.deb';
  var ua = navigator.userAgent;
  var os = /Android/i.test(ua) ? 'android' : /Windows/i.test(ua) ? 'windows' : /Mac/i.test(ua) ? 'mac' : /Linux/i.test(ua) ? 'linux' : 'windows';
  var card = $('.dl-card[data-os="' + os + '"]');
  if (card) { card.style.boxShadow = '6px 6px 0 var(--purple), 0 0 24px rgba(146,92,255,.35)'; }
  $$('.dl-card').forEach(function (c) {
    c.addEventListener('click', function () { notify('OPENING DOWNLOAD FOR ' + $('h3', c).textContent + '…'); });
  });
})();
