/* LYRICX Visualizer — Metaphor-style ink lyrics and animated backgrounds. */
(function (global) {
    'use strict';

    var KEYWORDS = {
        love: '#ff5c8a', light: '#ffd166', night: '#6d5cff', fire: '#ff7a45',
        heart: '#ff5c8a', dream: '#7ad7ff', run: '#4ade80', fly: '#7ad7ff',
        lost: '#b388ff', hope: '#ffd166', time: '#9aa7ff', blue: '#7ad7ff',
        red: '#ff6b6b', gold: '#ffd166', dark: '#8b7cff', star: '#fff1a8'
    };

    var SHOTS = [
        { scale: 1.00, dx: 0, dy: 0 },
        { scale: 1.12, dx: -0.06, dy: -0.02 },
        { scale: 1.08, dx: 0.07, dy: 0.03 },
        { scale: 1.22, dx: 0, dy: -0.05 }
    ];

    var noiseTile = null;
    var lastLineKey = '';
    var flood = 0;
    var lastStamp = 0;

    // Select a deterministic camera shot for a lyric line.
    function pickShot(index) {
        var normalized = (((index | 0) % SHOTS.length) + SHOTS.length) % SHOTS.length;
        return SHOTS[normalized];
    }

    // Keyword colours mirror the YTM Metaphor theme's highlighted words.
    function keywordColor(word, fallback) {
        var clean = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
        return KEYWORDS[clean] || fallback;
    }

    function getNoise(ctx) {
        if (noiseTile) return noiseTile;
        var tile = document.createElement('canvas');
        tile.width = 96;
        tile.height = 96;
        var tctx = tile.getContext('2d');
        var image = tctx.createImageData(96, 96);
        for (var i = 0; i < image.data.length; i += 4) {
            var value = Math.random() * 255;
            image.data[i] = value;
            image.data[i + 1] = value;
            image.data[i + 2] = value;
            image.data[i + 3] = Math.random() > 0.82 ? 26 : 0;
        }
        tctx.putImageData(image, 0, 0);
        noiseTile = ctx.createPattern(tile, 'repeat');
        return noiseTile;
    }

    function palette(theme, flip, negative) {
        var paper = theme === 'light' ? '#f3ebdd' : '#0f0d17';
        var ink = theme === 'light' ? '#12121a' : '#f3ebdd';
        if (flip) { var tmp = paper; paper = ink; ink = tmp; }
        if (negative) { var swap = paper; paper = ink; ink = swap; }
        return { paper: paper, ink: ink };
    }

    // Animated backgrounds: fluid gradient, aurora bands, or a retro grid.
    function drawBackground(ctx, options) {
        if (!ctx) return;
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;
        var stamp = options.stamp || 0;
        var mode = options.mode || 'fluid';
        var theme = options.theme;
        var ink = theme === 'light' ? 'rgba(109,40,217,' : 'rgba(146,92,255,';
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = theme === 'light' ? '#f7f1e8' : '#0a0910';
        ctx.fillRect(0, 0, w, h);

        if (mode === 'aurora') {
            for (var a = 0; a < 4; a++) {
                var y = h * (0.25 + a * 0.18) + Math.sin(stamp / 1400 + a) * h * 0.07;
                var grad = ctx.createLinearGradient(0, y - h * 0.2, 0, y + h * 0.2);
                grad.addColorStop(0, 'rgba(109,40,217,0)');
                grad.addColorStop(0.5, ink + (a % 2 ? '0.30)' : '0.22)'));
                grad.addColorStop(1, 'rgba(146,92,255,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, y - h * 0.2, w, h * 0.4);
            }
            return;
        }

        if (mode === 'grid') {
            ctx.strokeStyle = ink + '0.28)';
            ctx.lineWidth = Math.max(1, w / 900);
            var step = Math.max(26, w / 22);
            for (var x = (stamp / 90) % step; x < w; x += step) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }
            for (var y2 = (stamp / 140) % step; y2 < h; y2 += step) {
                ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(w, y2); ctx.stroke();
            }
            return;
        }

        var blobs = [
            { x: 0.22 + Math.sin(stamp / 2100) * 0.12, y: 0.28 + Math.cos(stamp / 1800) * 0.1, r: 0.5, c: 'rgba(109,40,217,0.34)' },
            { x: 0.78 + Math.cos(stamp / 1700) * 0.1, y: 0.7 + Math.sin(stamp / 2400) * 0.12, r: 0.55, c: 'rgba(146,92,255,0.26)' },
            { x: 0.5 + Math.sin(stamp / 2600) * 0.16, y: 0.55, r: 0.42, c: 'rgba(255,92,138,0.14)' }
        ];
        blobs.forEach(function (blob) {
            var radius = Math.max(w, h) * blob.r;
            var g = ctx.createRadialGradient(blob.x * w, blob.y * h, 0, blob.x * w, blob.y * h, radius);
            g.addColorStop(0, blob.c);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        });
    }

    function wrapLine(ctx, text, maxWidth) {
        var words = String(text || '').split(/\s+/).filter(Boolean);
        if (!words.length) return [''];
        var lines = [];
        var current = '';
        words.forEach(function (word) {
            // Break a token that cannot fit on its own (unspaced scripts, URLs).
            if (ctx.measureText(word).width > maxWidth) {
                if (current) { lines.push(current); current = ''; }
                var chunk = '';
                Array.from(word).forEach(function (character) {
                    if (ctx.measureText(chunk + character).width > maxWidth && chunk) {
                        lines.push(chunk);
                        chunk = character;
                    } else {
                        chunk += character;
                    }
                });
                current = chunk;
                return;
            }
            var candidate = current ? current + ' ' + word : word;
            if (ctx.measureText(candidate).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = candidate;
            }
        });
        if (current) lines.push(current);
        return lines.slice(0, 3);
    }

    // Draw the active lyric as ink metaballs, halftone and grain with camera cuts.
    function drawMetaphor(ctx, options) {
        if (!ctx) return;
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;
        var dpr = options.dpr || 1;
        var lines = options.lines || [];
        var position = Math.max(0, options.positionMs || 0);
        var index = options.activeIndex < 0 ? -1 : options.activeIndex;
        var theme = options.theme;
        var flip = Boolean(options.flip);
        var stamp = options.stamp || 0;

        var colors = palette(theme, flip, index >= 0 && index % 5 === 3);
        var shot = pickShot(index < 0 ? 0 : index);
        var isNegative = index >= 0 && index % 5 === 3;

        if (index >= 0) {
            var key = index + ':' + (lines[index] ? lines[index].text : '');
            if (key !== lastLineKey) { lastLineKey = key; flood = 1; }
        }
        flood = Math.max(0, flood - 0.022);

        ctx.clearRect(0, 0, w, h);

        // Metaballs behind the lyric, anchored to the current camera shot.
        var blobCount = 5;
        for (var i = 0; i < blobCount; i++) {
            var phase = stamp / (1300 + i * 240) + i * 1.7;
            var bx = w * (0.5 + shot.dx + Math.sin(phase) * 0.24);
            var by = h * (0.5 + shot.dy + Math.cos(phase * 0.8) * 0.2);
            var radius = Math.max(w, h) * (0.16 + (i % 3) * 0.05);
            var g = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
            var base = i % 2 === 0 ? colors.ink : colors.paper;
            g.addColorStop(0, hexAlpha(base, theme === 'light' ? 0.20 : 0.28));
            g.addColorStop(1, hexAlpha(base, 0));
            ctx.fillStyle = g;
            ctx.fillRect(bx - radius, by - radius, radius * 2, radius * 2);
        }

        // Halftone dots react to the audio level.
        var level = Math.max(0.08, Math.min(1, options.level || 0));
        var gap = Math.max(18 * dpr, w / 40);
        ctx.fillStyle = hexAlpha(colors.ink, theme === 'light' ? 0.10 : 0.14);
        for (var y = gap; y < h; y += gap) {
            for (var x = gap; x < w; x += gap) {
                var d = Math.hypot(x - w * 0.5, y - h * 0.5) / Math.max(w, h);
                var r = Math.max(0.7, (gap * 0.17) * (1 - d) * (0.5 + level));
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }
        }

        if (flood > 0) {
            ctx.fillStyle = hexAlpha(colors.ink, flood * (theme === 'light' ? 0.32 : 0.42));
            var fr = Math.max(w, h) * (1 - flood) * 1.2;
            var fg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(1, fr));
            fg.addColorStop(0, hexAlpha(colors.ink, 0));
            fg.addColorStop(1, hexAlpha(colors.ink, flood * 0.5));
            ctx.fillStyle = fg;
            ctx.fillRect(0, 0, w, h);
        }

        // Lyric text with hard camera cuts and keyword colours.
        var active = index >= 0 ? lines[index] : null;
        if (active) {
            var fontSize = Math.max(22 * dpr, Math.min(80 * dpr, w / 15));
            ctx.save();
            ctx.translate(w * (0.5 + shot.dx * 0.5), h * (0.48 + shot.dy * 0.5));
            ctx.scale(shot.scale, shot.scale);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '600 ' + fontSize + 'px "Trebuchet MS", "Segoe UI", sans-serif';
            var wrapped = wrapLine(ctx, active.text, w * 0.76);
            wrapped.forEach(function (row, rowIndex) {
                var parts = row.split(/\s+/).filter(Boolean);
                var widths = parts.map(function (part) { return ctx.measureText(part + ' ').width; });
                var total = widths.reduce(function (a, b) { return a + b; }, 0);
                var x = -total / 2;
                var y = (rowIndex - (wrapped.length - 1) / 2) * fontSize * 1.28;
                parts.forEach(function (part, partIndex) {
                    ctx.fillStyle = keywordColor(part, colors.ink);
                    ctx.shadowColor = hexAlpha(colors.ink, 0.45);
                    ctx.shadowBlur = 16 * dpr;
                    ctx.textAlign = 'left';
                    ctx.fillText(part, x, y);
                    x += widths[partIndex];
                });
            });
            ctx.restore();
        }

        // Paper grain, applied last so it sits over everything.
        var pattern = getNoise(ctx);
        if (pattern) {
            ctx.save();
            ctx.globalAlpha = theme === 'light' ? 0.5 : 0.7;
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    }

    function hexAlpha(hex, alpha) {
        var value = String(hex || '#ffffff').replace('#', '');
        if (value.length === 3) value = value.split('').map(function (c) { return c + c; }).join('');
        var number = parseInt(value, 16);
        if (!isFinite(number)) return 'rgba(255,255,255,' + alpha + ')';
        return 'rgba(' + ((number >> 16) & 255) + ',' + ((number >> 8) & 255) + ',' + (number & 255) + ',' + alpha + ')';
    }

    global.LXVisMetaphor = {
        drawBackground: drawBackground,
        drawMetaphor: drawMetaphor,
        pickShot: pickShot,
        keywordColor: keywordColor,
        wrapLine: function (text, width) {
            var probe = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
            if (!probe) return [String(text || '')];
            probe.font = '20px sans-serif';
            return wrapLine(probe, text, width);
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
