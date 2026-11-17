// src/utils/malayalamFonts.ts
// The Malayalam typefaces bundled with LYRICX. They are registered with @font-face in index.css,
// so every window (main, lyric style, OBS display) gets them from the same stylesheet. Loading them
// through document.fonts here also makes them available to canvas-based visualizers, which cannot
// rely on a font merely being declared in CSS.

export type MalayalamFontHintKey =
    | 'options.malayalamHintSans'
    | 'options.malayalamHintSerif'
    | 'options.malayalamHintCalligraphic'
    | 'options.malayalamHintRounded';

export type MalayalamFontEntry = {
    family: string;
    label: string;
    /** Compact name for the chip on the visualizer screen. */
    shortLabel: string;
    /** A short note shown under the family name in the selector. */
    hintKey: MalayalamFontHintKey;
};

export const MALAYALAM_FONTS: MalayalamFontEntry[] = [
    { family: 'Noto Sans Malayalam', label: 'Noto Sans Malayalam', shortLabel: 'Noto Sans ML', hintKey: 'options.malayalamHintSans' },
    { family: 'Noto Serif Malayalam', label: 'Noto Serif Malayalam', shortLabel: 'Noto Serif ML', hintKey: 'options.malayalamHintSerif' },
    { family: 'Manjari', label: 'Manjari', shortLabel: 'Manjari', hintKey: 'options.malayalamHintCalligraphic' },
    { family: 'Baloo Chettan 2', label: 'Baloo Chettan 2', shortLabel: 'Baloo', hintKey: 'options.malayalamHintRounded' },
];

const loadedFamilies = new Set<string>();

/**
 * Forces the bundled faces into the document font set. CSS font-display loads a face only when it
 * is used; canvas 2D and WebGL text need it to be loaded explicitly or they silently fall back.
 */
export const ensureMalayalamFontsLoaded = async (): Promise<void> => {
    if (typeof document === 'undefined' || typeof document.fonts?.load !== 'function') {
        return;
    }

    await Promise.all(MALAYALAM_FONTS.map(async ({ family }) => {
        if (loadedFamilies.has(family)) {
            return;
        }
        try {
            await document.fonts.load(`24px "${family}"`, 'മലയാളം');
            loadedFamilies.add(family);
        } catch {
            // A failed load must never hold up startup; the CSS fallbacks still render lyrics.
        }
    }));
};
