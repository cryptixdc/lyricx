import { describe, expect, it } from 'vitest';
import '../../../visualizer/metaphor.js';

// test/unit/visualizer/metaphor.test.ts — pure helpers for the Metaphor lyric style.
const metaphor = (globalThis as any).LXVisMetaphor as {
    pickShot: (index: number) => { scale: number; dx: number; dy: number };
    keywordColor: (word: string, fallback: string) => string;
    wrapLine: (text: string, width: number) => string[];
};

describe('visualizer metaphor helpers', () => {
    it('cycles deterministic camera shots for lyric lines', () => {
        const first = metaphor.pickShot(0);
        expect(first).toEqual(metaphor.pickShot(4));
        expect(metaphor.pickShot(1)).not.toEqual(first);
        expect(metaphor.pickShot(-1)).toEqual(metaphor.pickShot(3));
    });

    it('colors theme keywords and leaves other words with the ink color', () => {
        expect(metaphor.keywordColor('Love,', '#fff')).toBe('#ff5c8a');
        expect(metaphor.keywordColor('NIGHT', '#fff')).toBe('#6d5cff');
        expect(metaphor.keywordColor('ordinary', '#fff')).toBe('#fff');
    });

    it('keeps a line intact when no canvas measure is available', () => {
        expect(metaphor.wrapLine('hello world', 120)).toEqual(['hello world']);
    });
});
