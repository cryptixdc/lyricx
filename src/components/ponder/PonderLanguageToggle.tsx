import React from 'react';
import { usePonderStore, type PonderLanguage } from '../../stores/usePonderStore';
import { usePonderTranslation } from './usePonderTranslation';
import { PONDER_TEXT_BUTTON_CLASS } from './ponderTheme';

// src/components/ponder/PonderLanguageToggle.tsx
// The guide's own Malayalam / English switch. It lives in the Ponder chrome and the tutorial index,
// so you can flip languages while a walkthrough is on screen without touching app settings.

export const PonderLanguageToggle: React.FC = () => {
    const t = usePonderTranslation();
    const language = usePonderStore(state => state.language);
    const setLanguage = usePonderStore(state => state.setPonderLanguage);
    const next: PonderLanguage = language === 'ml' ? 'en' : 'ml';
    const label = language === 'ml' ? 'EN' : 'ML';
    const hint = t(language === 'ml' ? 'ponder.languageSwitchToEn' : 'ponder.languageSwitchToMl');

    return (
        <button
            type="button"
            data-testid="ponder-language-toggle"
            onClick={() => setLanguage(next)}
            className={PONDER_TEXT_BUTTON_CLASS}
            aria-label={hint}
            title={hint}
        >
            {label}
        </button>
    );
};

export default PonderLanguageToggle;
