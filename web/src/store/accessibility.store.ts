import { create } from 'zustand';

interface A11yState {
  fontSize: 'normal' | 'large' | 'xlarge';
  contrast: 'normal' | 'high';
  reducedMotion: boolean;
  setFontSize: (s: 'normal' | 'large' | 'xlarge') => void;
  setContrast: (c: 'normal' | 'high') => void;
  setReducedMotion: (r: boolean) => void;
  hydrate: () => void;
}

const FONT_MAP = { normal: '16px', large: '20px', xlarge: '24px' };

function applyToDOM(state: Pick<A11yState, 'fontSize' | 'contrast' | 'reducedMotion'>) {
  const root = document.documentElement;
  root.style.fontSize = FONT_MAP[state.fontSize];
  root.classList.toggle('high-contrast', state.contrast === 'high');
  root.classList.toggle('reduce-motion', state.reducedMotion);
}

export const useA11yStore = create<A11yState>((set) => ({
  fontSize: 'normal',
  contrast: 'normal',
  reducedMotion: false,

  setFontSize: (fontSize) => {
    localStorage.setItem('alivo_a11y_font', fontSize);
    set({ fontSize });
    applyToDOM({ fontSize, contrast: useA11yStore.getState().contrast, reducedMotion: useA11yStore.getState().reducedMotion });
  },

  setContrast: (contrast) => {
    localStorage.setItem('alivo_a11y_contrast', contrast);
    set({ contrast });
    applyToDOM({ fontSize: useA11yStore.getState().fontSize, contrast, reducedMotion: useA11yStore.getState().reducedMotion });
  },

  setReducedMotion: (reducedMotion) => {
    localStorage.setItem('alivo_a11y_motion', reducedMotion ? '1' : '0');
    set({ reducedMotion });
    applyToDOM({ fontSize: useA11yStore.getState().fontSize, contrast: useA11yStore.getState().contrast, reducedMotion });
  },

  hydrate: () => {
    const fontSize = (localStorage.getItem('alivo_a11y_font') as any) || 'normal';
    const contrast = (localStorage.getItem('alivo_a11y_contrast') as any) || 'normal';
    const reducedMotion = localStorage.getItem('alivo_a11y_motion') === '1';
    set({ fontSize, contrast, reducedMotion });
    applyToDOM({ fontSize, contrast, reducedMotion });
  },
}));
