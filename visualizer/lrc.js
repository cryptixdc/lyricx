/* LYRICX Visualizer — LRC parsing and active-line lookup for the Spotify edition. */
(function (global) {
    'use strict';

    var TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

    // Parse standard and enhanced LRC; metadata tags without a time are ignored.
    function parseLrc(source) {
        if (typeof source !== 'string' || !source.trim()) return [];
        var lines = [];
        source.split(/\r?\n/).forEach(function (row) {
            TIME_TAG.lastIndex = 0;
            var stamps = [];
            var match;
            while ((match = TIME_TAG.exec(row)) !== null) {
                var minutes = parseInt(match[1], 10);
                var seconds = parseInt(match[2], 10);
                var fraction = match[3] || '';
                var millis = fraction ? parseInt(fraction.padEnd(3, '0'), 10) : 0;
                if (!isFinite(minutes) || !isFinite(seconds)) continue;
                stamps.push(minutes * 60000 + seconds * 1000 + millis);
            }
            if (!stamps.length) return;
            var text = row.replace(TIME_TAG, '').trim();
            if (!text) return;
            stamps.forEach(function (timeMs) {
                lines.push({ timeMs: timeMs, text: text });
            });
        });
        return lines.sort(function (left, right) { return left.timeMs - right.timeMs; });
    }

    // Return the index of the last line already reached at positionMs, or -1.
    function activeLineIndex(lines, positionMs) {
        if (!lines || !lines.length) return -1;
        var position = Math.max(0, Number(positionMs) || 0);
        var low = 0;
        var high = lines.length - 1;
        var result = -1;
        while (low <= high) {
            var middle = (low + high) >> 1;
            if (lines[middle].timeMs <= position) {
                result = middle;
                low = middle + 1;
            } else {
                high = middle - 1;
            }
        }
        return result;
    }

    global.LXVisLrc = { parseLrc: parseLrc, activeLineIndex: activeLineIndex };
})(typeof window !== 'undefined' ? window : globalThis);
