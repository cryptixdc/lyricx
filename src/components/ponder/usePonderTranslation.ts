import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePonderStore } from '../../stores/usePonderStore';

// src/components/ponder/usePonderTranslation.ts
// Ponder's walkthrough has its own Malayalam/English switch, independent of the app's interface
// language. Every Ponder surface uses this hook, so flipping the toggle updates the whole guide.

export const usePonderTranslation = () => {
    const { i18n } = useTranslation();
    const language = usePonderStore(state => state.language);
    return useMemo(() => i18n.getFixedT(language), [i18n, language]);
};
