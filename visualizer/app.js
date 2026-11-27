/* LYRICX Visualizer — drives the standalone Spotify visualizer from a now-playing bridge. */
(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };
    var i18n = window.LXVisI18n;
    var lrc = window.LXVisLrc;
    // Capacitor registers plugins under window.Capacitor.Plugins, not as standalone globals.
    var androidBridge = window.Capacitor && window.Capacitor.Plugins
        ? window.Capacitor.Plugins.VisualizerBridge || null
        : null;
    var desktopBridge = window.visualizerBridge || null;
    var isAndroid = Boolean(androidBridge);
    var isDesktop = Boolean(desktopBridge);
    var language = 'en';
    var track = null;
    var lyrics = [];
    var trackKey = '';
    var positionMs = 0;
    var externalPositionMs = 0;
    var externalPositionAt = 0;
    var playing = false;
    var lastError = '';
    var sourceStatus = 'connecting';
    var audio = null;
    var loopbackActive = false;
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var metaphor = window.LXVisMetaphor || null;
    var canvas = $('visualizer');
    var context = canvas.getContext('2d');
    var bgCanvas = $('background');
    var bgContext = bgCanvas ? bgCanvas.getContext('2d') : null;
    var bars = 48;
    var frameSkip = 0;
    var currentLevels = null;
    var style = 'metaphor';
    var backgroundMode = 'fluid';

    try { language = localStorage.getItem('lyricx-vis-language') || 'en'; } catch (error) { language = 'en'; }
    if (i18n.languages.indexOf(language) === -1) language = 'en';
    try {
        var savedTheme = localStorage.getItem('lyricx-vis-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.setAttribute('data-theme', savedTheme);
        var savedStyle = localStorage.getItem('lyricx-vis-style');
        if (savedStyle === 'metaphor' || savedStyle === 'classic') style = savedStyle;
        var savedBackground = localStorage.getItem('lyricx-vis-background');
        if (savedBackground === 'fluid' || savedBackground === 'aurora' || savedBackground === 'grid') backgroundMode = savedBackground;
    } catch (error) { /* storage may be disabled */ }

    function t(key) { return i18n.translate(language, key); }

    function applyTexts() {
        $('eyebrow').textContent = t('eyebrow');
        $('headline').textContent = t('headline');
        $('lede').textContent = t('lede');
        $('lyricLabel').textContent = t('lyrics');
        $('retryBtn').textContent = t('retry');
        $('permissionBtn').textContent = t('permission');
        $('hint').textContent = (isAndroid ? t('hintAndroid') : t('hintDesktop'))
            + (style === 'metaphor' ? ' ' + t('metaphorNote') : '');
        $('styleSelect').querySelector('option[value="metaphor"]').textContent = t('styleMetaphor');
        $('styleSelect').querySelector('option[value="classic"]').textContent = t('styleClassic');
        $('bgSelect').querySelector('option[value="fluid"]').textContent = t('bgFluid');
        $('bgSelect').querySelector('option[value="aurora"]').textContent = t('bgAurora');
        $('bgSelect').querySelector('option[value="grid"]').textContent = t('bgGrid');
        $('styleSelect').value = style;
        $('bgSelect').value = backgroundMode;
        document.body.classList.toggle('metaphor', style === 'metaphor');
        $('langSelect').value = language;
        renderStatus();
        renderMode();
        renderLyrics();
    }

    function setStatus(text, state) {
        var node = $('status');
        node.textContent = text;
        node.setAttribute('data-state', state || '');
    }

    function renderStatus() {
        if (lastError || sourceStatus === 'error') { setStatus(t('error'), 'error'); return; }
        setStatus(track ? t('listening') : t('waiting'), track ? 'ok' : '');
    }

    function renderMode() {
        if (isAndroid) {
            $('modeLabel').textContent = t('modeAndroid');
        } else if (loopbackActive) {
            $('modeLabel').textContent = t('modeLoopback');
        } else {
            $('modeLabel').textContent = t('modeNoAudio');
        }
    }

    function normalizeTrack(raw) {
        if (!raw) return null;
        var title = String(raw.title || '').trim();
        var artist = String(raw.artist || raw.author || '').trim();
        if (!title && !artist) return null;
        return {
            title: title || 'Now Playing',
            artist: artist || 'Unknown artist',
            album: String(raw.album || '').trim(),
            durationMs: Number(raw.durationMs || 0) || 0,
            progressMs: Number(raw.progressMs || 0) || 0,
            playing: Boolean(raw.playing),
            coverUrl: raw.coverUrl || null
        };
    }

    function keyOf(value) {
        return (value.artist + '|' + value.title).toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function renderTrack() {
        $('trackTitle').textContent = track ? track.title : '—';
        $('trackArtist').textContent = track ? track.artist : '—';
        if (track && track.durationMs > 0) {
            $('progressBar').style.width = Math.min(100, (positionMs / track.durationMs) * 100) + '%';
        } else {
            $('progressBar').style.width = '0%';
        }
    }

    function renderLyrics() {
        var index = lrc.activeLineIndex(lyrics, positionMs);
        $('lyricActive').textContent = index >= 0 ? lyrics[index].text : (track ? t('noLyrics') : t('waitingLyrics'));
        var next = [];
        for (var i = index + 1; i < Math.min(lyrics.length, index + 4); i++) next.push('<p>' + escapeHtml(lyrics[i].text) + '</p>');
        $('lyricNext').innerHTML = next.join('');
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
    }

    // Lyrics are always fetched online; a new track always triggers a fresh lookup.
    function loadLyrics(song, force) {
        var key = keyOf(song);
        if (!force && key === trackKey) return;
        trackKey = key;
        lyrics = [];
        renderLyrics();
        var query = { artist: song.artist, title: song.title, album: song.album || '' };
        var promise = isAndroid
            ? androidBridge.fetchLyrics(query)
            : desktopBridge.fetchLyrics(query);
        Promise.resolve(promise).then(function (result) {
            if (!result) return;
            var source = result.syncedLyrics || result.plainLyrics || result.lrc || '';
            var parsed = lrc.parseLrc(source);
            if (!parsed.length && result.plainLyrics) {
                parsed = [{ timeMs: 0, text: result.plainLyrics.trim() }];
            }
            if (keyOf(song) === trackKey) {
                lyrics = parsed;
                renderLyrics();
                drawStill();
            }
        }).catch(function (error) {
            lastError = String(error && error.message || error || 'lyrics lookup failed');
            renderStatus();
        });
    }

    function updateTrack(raw) {
        var next = normalizeTrack(raw);
        if (!next) return;
        var changed = !track || keyOf(next) !== keyOf(track);
        if (changed || (next.progressMs && Math.abs(next.progressMs - externalPositionMs) > 1200)) {
            externalPositionMs = next.progressMs;
            externalPositionAt = Date.now();
            positionMs = externalPositionMs;
        } else if (!next.playing) {
            positionMs = externalPositionMs;
        }
        playing = next.playing;
        track = next;
        renderStatus();
        renderTrack();
        renderLyrics();
        drawStill();
        if (changed) loadLyrics(next, false);
    }

    function poll() {
        var promise = isAndroid ? androidBridge.getNowPlaying() : desktopBridge.getTrack();
        Promise.resolve(promise).then(function (raw) {
            lastError = '';
            sourceStatus = raw && raw.status ? raw.status : 'connected';
            renderStatus();
            updateTrack(raw);
        }).catch(function (error) {
            lastError = String(error && error.message || error || 'now-playing unavailable');
            sourceStatus = 'error';
            renderStatus();
        });
    }

    // Prefer a real loopback input on desktop; never silently switch to the microphone.
    function setupLoopbackAudio() {
        if (!isDesktop || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
            var pattern = /loopback|stereo mix|monitor|blackhole|vb-cable|cable output/i;
            var candidate = null;
            devices.forEach(function (device) {
                if (device.kind === 'audioinput' && pattern.test(device.label || '')) candidate = device.deviceId;
            });
            if (!candidate) return;
            navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: candidate },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            }).then(function (stream) {
                var ctx = new (window.AudioContext || window.webkitAudioContext)();
                var source = ctx.createMediaStreamSource(stream);
                var analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.75;
                source.connect(analyser);
                audio = {
                    analyser: analyser,
                    data: new Uint8Array(analyser.frequencyBinCount),
                    context: ctx,
                    stream: stream
                };
                loopbackActive = true;
                renderMode();
            }).catch(function () { loopbackActive = false; });
        }).catch(function () { loopbackActive = false; });
    }

    function resizeCanvas() {
        var ratio = window.devicePixelRatio || 1;
        var rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width * ratio));
        canvas.height = Math.max(1, Math.floor(rect.height * ratio));
        if (bgCanvas) {
            bgCanvas.width = canvas.width;
            bgCanvas.height = canvas.height;
        }
    }

    function drawBars(levels) {
        if (!context) return;
        var width = canvas.width;
        var height = canvas.height;
        context.clearRect(0, 0, width, height);
        var gap = Math.max(2, Math.floor(width / (bars * 3)));
        var barWidth = Math.max(2, Math.floor((width - gap * (bars - 1)) / bars));
        for (var i = 0; i < bars; i++) {
            var level = levels[i] || 0;
            var barHeight = Math.max(3, level * height * 0.82);
            var x = i * (barWidth + gap);
            var gradient = context.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, 'rgba(146,92,255,.85)');
            gradient.addColorStop(1, 'rgba(201,167,255,.95)');
            context.fillStyle = gradient;
            context.fillRect(x, height - barHeight, barWidth, barHeight);
            context.fillStyle = 'rgba(12,12,18,.45)';
            context.fillRect(x, height - barHeight - 4, barWidth, 2);
        }
    }

    function timingLevels(now) {
        var out = [];
        var beat = positionMs / 520;
        for (var i = 0; i < bars; i++) {
            var wave = Math.sin(i * 0.42 + beat * 2.1) * 0.5 + 0.5;
            var pulse = Math.sin(now / 260 + i * 0.17) * 0.5 + 0.5;
            out.push(playing ? Math.min(1, 0.14 + wave * 0.52 + pulse * 0.28) : 0.08 + wave * 0.1);
        }
        return out;
    }

    // One-shot frame for prefers-reduced-motion: no RAF, but lyrics are still drawn.
    function drawStill() {
        if (!reducedMotion) return;
        var theme = document.documentElement.getAttribute('data-theme');
        if (bgContext && metaphor) {
            metaphor.drawBackground(bgContext, { mode: backgroundMode, theme: theme, stamp: 0 });
        }
        if (style === 'metaphor' && metaphor) {
            metaphor.drawMetaphor(context, {
                lines: lyrics,
                activeIndex: lrc.activeLineIndex(lyrics, positionMs),
                positionMs: positionMs,
                level: 0.15,
                theme: theme,
                flip: false,
                stamp: 0,
                dpr: window.devicePixelRatio || 1
            });
        } else {
            drawBars(timingLevels(0));
        }
    }

    function frame(now) {
        if (document.hidden) {
            window.requestAnimationFrame(frame);
            return;
        }
        if (track && externalPositionAt) {
            positionMs = externalPositionMs + (playing ? Math.max(0, Date.now() - externalPositionAt) : 0);
            if (track.durationMs > 0) positionMs = Math.min(positionMs, track.durationMs);
        }
        if (++frameSkip % 2 === 0) {
            var levels = null;
            if (audio) {
                audio.analyser.getByteFrequencyData(audio.data);
                levels = [];
                for (var i = 0; i < bars; i++) {
                    var index = Math.floor(i * audio.data.length / bars);
                    levels.push(audio.data[index] / 255);
                }
                if (levels.every(function (level) { return level === 0; })) levels = null;
            }
            currentLevels = levels;
            if (bgContext && metaphor) {
                metaphor.drawBackground(bgContext, {
                    mode: backgroundMode,
                    theme: document.documentElement.getAttribute('data-theme'),
                    stamp: now
                });
            }
            if (style === 'metaphor' && metaphor) {
                var average = 0;
                if (levels) {
                    levels.forEach(function (value) { average += value; });
                    average /= levels.length;
                } else {
                    average = playing ? 0.45 : 0.12;
                }
                metaphor.drawMetaphor(context, {
                    lines: lyrics,
                    activeIndex: lrc.activeLineIndex(lyrics, positionMs),
                    positionMs: positionMs,
                    level: average,
                    theme: document.documentElement.getAttribute('data-theme'),
                    flip: false,
                    stamp: now,
                    dpr: window.devicePixelRatio || 1
                });
            } else {
                drawBars(levels || timingLevels(now));
            }
            renderTrack();
            renderLyrics();
        }
        window.requestAnimationFrame(frame);
    }

    $('themeBtn').addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('lyricx-vis-theme', next); } catch (error) { /* storage may be disabled */ }
        drawStill();
    });

    $('langSelect').addEventListener('change', function (event) {
        language = event.target.value;
        try { localStorage.setItem('lyricx-vis-language', language); } catch (error) { /* storage may be disabled */ }
        applyTexts();
        drawStill();
    });

    $('styleSelect').addEventListener('change', function (event) {
        style = event.target.value === 'classic' ? 'classic' : 'metaphor';
        try { localStorage.setItem('lyricx-vis-style', style); } catch (error) { /* storage may be disabled */ }
        applyTexts();
        drawStill();
    });

    $('bgSelect').addEventListener('change', function (event) {
        backgroundMode = event.target.value;
        try { localStorage.setItem('lyricx-vis-background', backgroundMode); } catch (error) { /* storage may be disabled */ }
        applyTexts();
        drawStill();
    });

    $('retryBtn').addEventListener('click', function () { if (track) loadLyrics(track, true); });
    $('permissionBtn').addEventListener('click', function () {
        Promise.resolve(androidBridge.requestPermission()).catch(function () { /* system UI handles the result */ });
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    applyTexts();

    if (!reducedMotion) {
        window.requestAnimationFrame(frame);
    } else {
        drawStill();
    }

    if (isAndroid) {
        Promise.resolve(androidBridge.isListening()).then(function (value) {
            $('permissionBtn').hidden = Boolean(value);
        }).catch(function () { $('permissionBtn').hidden = false; });
        if (androidBridge.addListener) {
            androidBridge.addListener('nowPlaying', function (value) { updateTrack(value); });
        }
    } else if (isDesktop) {
        setupLoopbackAudio();
        if (desktopBridge.onTrack) {
            desktopBridge.onTrack(function (value) {
                sourceStatus = value && value.status ? value.status : 'connected';
                updateTrack(value);
            });
        }
        if (desktopBridge.onStatus) {
            desktopBridge.onStatus(function (value) { sourceStatus = value; renderStatus(); });
        }
    }

    poll();
    window.setInterval(poll, 900);
})();
