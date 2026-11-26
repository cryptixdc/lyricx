import { describe, expect, it } from 'vitest';
import '../../../visualizer/lrc.js';

// test/unit/visualizer/lrc.test.ts — LRC sync helpers for the standalone Spotify Visualizer edition.
const { parseLrc, activeLineIndex } = (globalThis as any).LXVisLrc as {
    parseLrc: (source: string) => Array<{ timeMs: number; text: string }>;
    activeLineIndex: (lines: Array<{ timeMs: number; text: string }>, positionMs: number) => number;
};

describe('visualizer LRC', () => {
    it('parses timestamped lines and ignores metadata', () => {
        const lines = parseLrc([
            '[ti:Example]',
            '[ar:Artist]',
            '[00:01.20]First line',
            '[00:03.500]Second line',
            '[01:02.03]Third line'
        ].join('\n'));

        expect(lines).toEqual([
            { timeMs: 1200, text: 'First line' },
            { timeMs: 3500, text: 'Second line' },
            { timeMs: 62030, text: 'Third line' }
        ]);
    });

    it('expands lines that carry several timestamps', () => {
        const lines = parseLrc('[00:01.00][00:02.00]Repeated');
        expect(lines.map(line => line.timeMs)).toEqual([1000, 2000]);
    });

    it('finds the last reached line or -1 before the first one', () => {
        const lines = parseLrc('[00:01.00]One\n[00:04.00]Two\n[00:08.00]Three');
        expect(activeLineIndex(lines, 0)).toBe(-1);
        expect(activeLineIndex(lines, 1000)).toBe(0);
        expect(activeLineIndex(lines, 3999)).toBe(0);
        expect(activeLineIndex(lines, 9000)).toBe(2);
        expect(activeLineIndex([], 1000)).toBe(-1);
    });
});
